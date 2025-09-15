-- Fix security linter issues from previous migration

-- Fix 1: Remove the SECURITY DEFINER view and replace with a safer approach
DROP VIEW IF EXISTS public.safe_profiles;

-- Fix 2 & 3: Add search_path to functions for security
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- For UPDATE operations, ensure sensitive fields aren't changed inappropriately
  IF TG_OP = 'UPDATE' THEN
    -- Prevent unauthorized email changes
    IF OLD.email IS DISTINCT FROM NEW.email AND auth.uid() != OLD.user_id THEN
      RAISE EXCEPTION 'Unauthorized email modification attempt detected';
    END IF;
    
    -- Sanitize and validate input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Ensure user can only create their own profile
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Users can only create their own profiles';
    END IF;
    
    -- Sanitize input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the suspicious access detection function with proper search_path
CREATE OR REPLACE FUNCTION public.detect_suspicious_profile_access()
RETURNS TABLE(user_id uuid, access_count bigint, last_access timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    accessor_user_id,
    COUNT(*) as access_count,
    MAX(accessed_at) as last_access
  FROM public.profile_access_logs
  WHERE accessed_at > NOW() - INTERVAL '1 hour'
  GROUP BY accessor_user_id
  HAVING COUNT(*) > 50
  ORDER BY access_count DESC;
$$;

-- Create a safer function-based approach for secure profile display
CREATE OR REPLACE FUNCTION public.get_safe_profile_display(target_user_id uuid)
RETURNS TABLE(
  id uuid, 
  display_name text, 
  role text, 
  grade_level integer, 
  school_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if viewing own profile or user is a teacher
  IF auth.uid() = target_user_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RETURN QUERY
    SELECT 
      p.id,
      CASE 
        WHEN auth.uid() = p.user_id THEN p.full_name
        ELSE LEFT(p.full_name, 1) || '***'
      END as display_name,
      p.role,
      p.grade_level,
      CASE 
        WHEN auth.uid() = p.user_id THEN p.school_name
        ELSE NULL
      END as school_name
    FROM public.profiles p
    WHERE p.user_id = target_user_id;
  END IF;
END;
$$;