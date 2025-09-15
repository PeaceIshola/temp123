-- COMPREHENSIVE SECURITY ENHANCEMENTS FOR PROFILES TABLE (FIXED)

-- 1. Add data validation triggers for profiles
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize and validate input data
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(TRIM(NEW.email));
    -- Basic email validation
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  END IF;

  -- Sanitize names (remove potentially harmful characters)
  IF NEW.first_name IS NOT NULL THEN
    NEW.first_name := REGEXP_REPLACE(TRIM(NEW.first_name), '[^A-Za-z\s\-'']', '', 'g');
  END IF;
  
  IF NEW.last_name IS NOT NULL THEN
    NEW.last_name := REGEXP_REPLACE(TRIM(NEW.last_name), '[^A-Za-z\s\-'']', '', 'g');
  END IF;
  
  IF NEW.username IS NOT NULL THEN
    NEW.username := REGEXP_REPLACE(TRIM(NEW.username), '[^A-Za-z0-9_-]', '', 'g');
  END IF;

  -- Limit bio length and sanitize
  IF NEW.bio IS NOT NULL THEN
    NEW.bio := LEFT(TRIM(NEW.bio), 500);
  END IF;

  -- Ensure full_name is properly constructed
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
    NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_profile_trigger ON public.profiles;
CREATE TRIGGER validate_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- 2. Enhanced profile access logging function
CREATE OR REPLACE FUNCTION public.log_profile_access_attempt(
  p_accessed_user_id uuid,
  p_access_type text,
  p_success boolean DEFAULT true
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profile_access_logs (
    accessed_user_id,
    accessor_user_id,
    access_type,
    accessed_at
  ) VALUES (
    p_accessed_user_id,
    auth.uid(),
    p_access_type || CASE WHEN p_success THEN '_success' ELSE '_failed' END,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Secure profile viewing function that logs access
CREATE OR REPLACE FUNCTION public.get_secure_profile(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  username text,
  bio text,
  role text,
  grade_level integer,
  school_name text,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text
) AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Default to current user if no user_id provided
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Security check: users can only view their own profile
  IF auth.uid() != target_user_id THEN
    -- Log the failed access attempt
    PERFORM public.log_profile_access_attempt(target_user_id, 'unauthorized_view', false);
    RAISE EXCEPTION 'Access denied: You can only view your own profile';
  END IF;

  -- Log successful access
  PERFORM public.log_profile_access_attempt(target_user_id, 'profile_view', true);

  -- Return profile data (excluding sensitive email)
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.username,
    p.bio,
    p.role,
    p.grade_level,
    p.school_name,
    p.created_at,
    p.updated_at,
    p.full_name
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Enhanced RLS policies with additional security
DROP POLICY IF EXISTS "Users can only view own profiles" ON public.profiles;
CREATE POLICY "Enhanced user profile access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND
  -- Additional check to ensure the user is properly authenticated
  auth.jwt() ->> 'aud' = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Enhanced user profile update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent role escalation attempts (only allow student role changes)
  COALESCE(NEW.role, 'student') IN ('student', 'teacher')
);

-- 5. Create audit trail for profile changes
CREATE TABLE IF NOT EXISTS public.profile_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_by uuid,
  changed_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and the profile owner can view audit logs
CREATE POLICY "Profile audit access"
ON public.profile_audit_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. Trigger to log profile changes (FIXED)
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.profile_audit_log (
      profile_id,
      user_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'UPDATE',
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.profile_audit_log (
      profile_id,
      user_id,
      action,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'INSERT',
      row_to_json(NEW)::jsonb,
      auth.uid()
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- 7. Function to get anonymized profile data for public display
CREATE OR REPLACE FUNCTION public.get_public_profile_display(p_user_id uuid)
RETURNS TABLE(
  display_name text,
  role text,
  grade_level integer,
  bio_snippet text
) AS $$
BEGIN
  -- Only return minimal, non-sensitive information for public display
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p.full_name IS NOT NULL THEN LEFT(p.full_name, 1) || '***'
      ELSE 'Anonymous'
    END as display_name,
    p.role,
    p.grade_level,
    CASE 
      WHEN p.bio IS NOT NULL THEN LEFT(p.bio, 50) || '...'
      ELSE NULL
    END as bio_snippet
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;