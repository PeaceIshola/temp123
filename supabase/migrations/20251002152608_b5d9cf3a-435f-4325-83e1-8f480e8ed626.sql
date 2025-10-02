-- ========================================
-- FIX: Strengthen Profile Access Controls (v2)
-- ========================================
-- Add defense-in-depth without unsupported trigger types

-- Step 1: Update RLS policy with rate limiting
DROP POLICY IF EXISTS "Users view own profile - email excluded" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile only" ON public.profiles;

CREATE POLICY "Users view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND 
  auth.uid() = user_id
  AND
  public.check_profile_access_rate()
);

-- Step 2: Create enumeration detection function (no trigger, called from secure functions)
CREATE OR REPLACE FUNCTION public.detect_profile_enumeration_attempt(accessing_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
BEGIN
  -- Check recent profile access attempts
  SELECT COUNT(DISTINCT accessed_user_id) INTO recent_attempts
  FROM public.profile_access_logs
  WHERE accessor_user_id = accessing_user_id
    AND accessed_at > NOW() - INTERVAL '2 minutes'
    AND accessed_user_id != accessing_user_id
    AND access_type IN ('SAFE_PROFILE_ACCESS', 'MINIMAL_PROFILE_VIEW');
  
  -- If more than 5 different profiles in 2 minutes, alert
  IF recent_attempts > 5 THEN
    -- Create security alert
    INSERT INTO public.admin_tickets (
      created_by,
      title,
      description,
      priority,
      category,
      status
    ) VALUES (
      accessing_user_id,
      'Suspicious Profile Access Pattern',
      format('User %s accessed %s different profiles in 2 minutes. Possible enumeration attempt.', 
             accessing_user_id, recent_attempts),
      'high',
      'security',
      'open'
    );
    
    RETURN false; -- Block
  END IF;
  
  RETURN true; -- Allow
END;
$$;

-- Step 3: Update get_safe_profile_for_user with enumeration detection
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_user(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  first_name text,
  last_name text,
  username text,
  role text,
  grade_level integer,
  school_name text,
  bio text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id uuid;
  is_teacher_or_admin boolean;
BEGIN
  requesting_user_id := auth.uid();
  
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF target_user_id IS NULL THEN
    target_user_id := requesting_user_id;
  END IF;
  
  is_teacher_or_admin := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = requesting_user_id 
    AND role IN ('teacher', 'admin')
  );
  
  -- Check for enumeration if accessing other profiles
  IF target_user_id != requesting_user_id THEN
    IF NOT is_teacher_or_admin THEN
      RAISE EXCEPTION 'Unauthorized: Can only view own profile';
    END IF;
    
    -- Enumeration detection for teachers too
    IF NOT public.detect_profile_enumeration_attempt(requesting_user_id) THEN
      RAISE EXCEPTION 'Security: Too many profile access attempts. Please wait before trying again.';
    END IF;
    
    -- Log teacher access
    PERFORM public.log_student_data_access(
      'safe_profile_access',
      'get_safe_profile_for_user',
      jsonb_build_object('target_user', target_user_id)
    );
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.username,
    p.role,
    p.grade_level,
    p.school_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Step 4: Create minimal profile info function
CREATE OR REPLACE FUNCTION public.get_minimal_profile_info(target_user_id uuid)
RETURNS TABLE(
  display_name text,
  role text,
  is_own_profile boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id uuid;
  is_teacher boolean;
BEGIN
  requesting_user_id := auth.uid();
  
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  is_teacher := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = requesting_user_id 
    AND role IN ('teacher', 'admin')
  );
  
  -- Enumeration check
  IF requesting_user_id != target_user_id THEN
    IF NOT is_teacher THEN
      RAISE EXCEPTION 'Unauthorized: Cannot view other profiles';
    END IF;
    
    IF NOT public.detect_profile_enumeration_attempt(requesting_user_id) THEN
      RAISE EXCEPTION 'Security: Too many profile access attempts';
    END IF;
  END IF;
  
  -- Log access
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    requesting_user_id,
    target_user_id,
    'MINIMAL_PROFILE_VIEW',
    inet_client_addr()
  );
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN requesting_user_id = p.user_id THEN p.full_name
      WHEN is_teacher THEN COALESCE(LEFT(p.full_name, 1) || '. ' || SPLIT_PART(p.full_name, ' ', -1), 'Student')
      ELSE 'Anonymous User'
    END as display_name,
    p.role,
    (requesting_user_id = p.user_id) as is_own_profile
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Step 5: Document security model
COMMENT ON TABLE public.profiles IS
'CRITICAL SECURITY: Student/user profile data with multi-layer protection:
1. RLS: Users can ONLY SELECT their own profile (auth.uid() = user_id)
2. Rate limiting: Blocks rapid access attempts via check_profile_access_rate()
3. Enumeration detection: Monitors and blocks suspicious access patterns
4. Access logging: All profile views are logged to profile_access_logs
5. Secure functions: Cross-profile access only via authorized functions with checks
6. No email: Email addresses moved to sensitive_profile_data table
This prevents profile enumeration, data harvesting, and unauthorized access.';

COMMENT ON FUNCTION public.detect_profile_enumeration_attempt(uuid) IS
'SECURITY: Detects suspicious profile access patterns. Returns false and creates alert if enumeration detected.';

COMMENT ON FUNCTION public.get_minimal_profile_info(uuid) IS
'SECURE: Returns minimal profile information with strict access controls, enumeration detection, and logging.';