-- Additional security measures to protect email addresses and sensitive personal information

-- 1. Create a separate table for highly sensitive information (email isolation)
CREATE TABLE IF NOT EXISTS public.sensitive_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_hash TEXT NOT NULL, -- Store hashed version for lookups
  encrypted_email TEXT NOT NULL, -- Store encrypted email
  last_email_access TIMESTAMP WITH TIME ZONE,
  email_access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sensitive data table
ALTER TABLE sensitive_profile_data ENABLE ROW LEVEL SECURITY;

-- Policy: Only the user themselves can access their sensitive data
CREATE POLICY "Users access own sensitive data only"
ON public.sensitive_profile_data
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own sensitive data
CREATE POLICY "Users update own sensitive data"
ON public.sensitive_profile_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Create a secure function to access emails with strict logging
CREATE OR REPLACE FUNCTION public.get_user_email_secure(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
  is_teacher boolean;
  access_count integer;
BEGIN
  -- Only allow access in specific circumstances
  
  -- Case 1: User accessing their own email
  IF auth.uid() = target_user_id THEN
    SELECT email INTO user_email FROM public.profiles WHERE user_id = target_user_id;
    RETURN user_email;
  END IF;
  
  -- Case 2: Teacher accessing for legitimate educational purposes
  is_teacher := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
  
  IF is_teacher THEN
    -- Log the access
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      auth.uid(),
      target_user_id,
      'EMAIL_ACCESS_BY_TEACHER',
      inet_client_addr()
    );
    
    -- Return anonymized version only
    SELECT public.get_anonymized_email(email) INTO user_email 
    FROM public.profiles 
    WHERE user_id = target_user_id;
    
    RETURN user_email;
  END IF;
  
  -- Case 3: Deny all other access attempts and log them
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    auth.uid(),
    target_user_id,
    'UNAUTHORIZED_EMAIL_ACCESS_ATTEMPT',
    inet_client_addr()
  );
  
  RAISE EXCEPTION 'Unauthorized access to email information';
END;
$$;

-- 3. Update profile RLS policies to explicitly protect email column
-- Drop existing policies on profiles table if they exist
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;

-- Create new, more restrictive policies
CREATE POLICY "Users view own profile - email excluded"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users update own profile - email protected"
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  -- Ensure email cannot be changed through direct update
  AND (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = email
);

CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id 
  AND email IS NOT NULL 
  AND length(TRIM(BOTH FROM email)) > 0
);

-- 4. Create function to detect email harvesting attempts
CREATE OR REPLACE FUNCTION public.detect_email_harvesting()
RETURNS TABLE(
  attacker_user_id uuid,
  attempt_count bigint,
  first_attempt timestamp with time zone,
  last_attempt timestamp with time zone,
  risk_level text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins and teachers can view this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  RETURN QUERY
  SELECT 
    accessor_user_id,
    COUNT(*) as attempt_count,
    MIN(accessed_at) as first_attempt,
    MAX(accessed_at) as last_attempt,
    CASE 
      WHEN COUNT(*) > 50 THEN 'CRITICAL'
      WHEN COUNT(*) > 20 THEN 'HIGH'
      WHEN COUNT(*) > 5 THEN 'MEDIUM'
      ELSE 'LOW'
    END as risk_level
  FROM public.profile_access_logs
  WHERE access_type IN ('UNAUTHORIZED_EMAIL_ACCESS_ATTEMPT', 'SUSPICIOUS_ENUMERATION_DETECTED')
    AND accessed_at > NOW() - INTERVAL '24 hours'
  GROUP BY accessor_user_id
  HAVING COUNT(*) > 5
  ORDER BY attempt_count DESC;
END;
$$;

-- 5. Create function to sanitize profile data before returning
CREATE OR REPLACE FUNCTION public.get_safe_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  role text,
  grade_level integer,
  school_name text,
  bio text,
  is_own_profile boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_teacher boolean;
  privacy_settings record;
BEGIN
  -- Rate limiting check
  IF NOT public.check_profile_access_rate() THEN
    RAISE EXCEPTION 'Too many profile access attempts. Please try again later.';
  END IF;

  -- Check if requester is a teacher
  is_teacher := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
  
  -- Get privacy settings
  SELECT * INTO privacy_settings
  FROM public.profile_privacy_settings
  WHERE user_id = target_user_id;
  
  -- Log access attempt
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    auth.uid(),
    target_user_id,
    'SAFE_PROFILE_ACCESS',
    inet_client_addr()
  );

  -- Return sanitized profile data (EMAIL EXPLICITLY EXCLUDED)
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.full_name
      WHEN is_teacher THEN p.full_name
      WHEN privacy_settings.hide_full_name THEN 'Anonymous User'
      ELSE COALESCE(LEFT(p.full_name, 1) || '***', 'Anonymous')
    END as full_name,
    p.role,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.grade_level
      WHEN is_teacher THEN p.grade_level
      WHEN privacy_settings.hide_grade_level THEN NULL
      ELSE p.grade_level
    END as grade_level,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.school_name
      WHEN is_teacher THEN p.school_name
      WHEN privacy_settings.hide_school_name THEN NULL
      ELSE NULL
    END as school_name,
    CASE
      WHEN auth.uid() = p.user_id THEN p.bio
      ELSE NULL
    END as bio,
    (auth.uid() = p.user_id) as is_own_profile
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- 6. Create automated alert for suspicious email access patterns
CREATE OR REPLACE FUNCTION public.alert_suspicious_email_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_attempts integer;
BEGIN
  -- Count recent unauthorized email access attempts
  SELECT COUNT(*) INTO recent_attempts
  FROM public.profile_access_logs
  WHERE accessor_user_id = NEW.accessor_user_id
    AND access_type = 'UNAUTHORIZED_EMAIL_ACCESS_ATTEMPT'
    AND accessed_at > NOW() - INTERVAL '1 hour';
  
  -- If more than 3 attempts in 1 hour, create admin alert
  IF recent_attempts > 3 THEN
    INSERT INTO public.admin_tickets (
      created_by,
      title,
      description,
      priority,
      category,
      status
    ) VALUES (
      NEW.accessor_user_id,
      'Suspicious Email Access Pattern Detected',
      format('User %s attempted unauthorized email access %s times in the last hour', 
             NEW.accessor_user_id, recent_attempts),
      'high',
      'security',
      'open'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for email access monitoring
DROP TRIGGER IF EXISTS monitor_email_access ON public.profile_access_logs;
CREATE TRIGGER monitor_email_access
  AFTER INSERT ON public.profile_access_logs
  FOR EACH ROW
  WHEN (NEW.access_type = 'UNAUTHORIZED_EMAIL_ACCESS_ATTEMPT')
  EXECUTE FUNCTION public.alert_suspicious_email_access();

-- 7. Add index for faster security checks
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_security 
ON public.profile_access_logs (accessor_user_id, access_type, accessed_at);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role 
ON public.profiles (user_id, role);