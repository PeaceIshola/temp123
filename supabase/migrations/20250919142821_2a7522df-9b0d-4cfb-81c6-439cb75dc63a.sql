-- SECURITY FIX: Implement secure RLS policies with zero-trust model

-- 1. Update the verify_profile_access function to be more restrictive
CREATE OR REPLACE FUNCTION public.verify_profile_access(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ZERO-TRUST: Only allow access to own profile data
  -- Teachers must use specific educational functions for legitimate access
  RETURN (auth.uid() = profile_user_id);
END;
$$;

-- 2. Create secure RLS policies that only allow self-access to sensitive data
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

CREATE POLICY "Users can only insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND
  email IS NOT NULL AND
  length(trim(email)) > 0
);

CREATE POLICY "Users can only update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- 3. Create a secure function for teachers to get minimal student information
CREATE OR REPLACE FUNCTION public.get_educational_student_data()
RETURNS TABLE(
  student_id text,           -- Anonymized ID, not the real UUID
  display_name text,         -- First name + last initial only
  grade_level integer,
  school_name text,
  role_verified text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher access required';
  END IF;

  -- Return only minimal educational data needed for teaching purposes
  -- No emails, no full names, no sensitive personal information
  RETURN QUERY
  SELECT 
    ('Student-' || abs(hashtext(p.user_id::text) % 99999))::text as student_id,
    CASE 
      WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL THEN 
        p.first_name || ' ' || LEFT(p.last_name, 1) || '.'
      WHEN p.full_name IS NOT NULL THEN
        SPLIT_PART(p.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(p.full_name, ' ', 2), 1) || '.'
      ELSE 'Student'
    END as display_name,
    p.grade_level,
    p.school_name,
    'student'::TEXT as role_verified
  FROM public.profiles p
  WHERE p.role = 'student'
  ORDER BY p.grade_level, display_name;
END;
$$;

-- 4. Create audit function to log any attempts to access student data
CREATE OR REPLACE FUNCTION public.log_student_data_access(
  access_type text,
  accessed_function text,
  additional_info jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access to student data for security monitoring
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    auth.uid(), -- Self-reference for system access logs
    access_type || '_' || accessed_function,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Additional logging can be added here for compliance
END;
$$;

-- 5. Update existing teacher functions to use audit logging and be more secure
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(student_id uuid, full_name text, grade_level integer, school_name text, anonymized_email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Teachers only';
  END IF;

  -- Log the access for audit purposes
  PERFORM public.log_student_data_access('read', 'get_students_for_teacher');

  -- Return student information without exposing full emails
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.grade_level,
    p.school_name,
    public.get_anonymized_email(p.email) as anonymized_email
  FROM public.profiles p
  WHERE p.role = 'student';
END;
$$;

-- 6. Add security documentation
COMMENT ON FUNCTION public.verify_profile_access(uuid) IS 'SECURITY: Zero-trust model - only allows self-access to profiles';
COMMENT ON FUNCTION public.get_educational_student_data() IS 'SECURITY: Provides minimal student data for teachers following principle of least privilege';
COMMENT ON FUNCTION public.log_student_data_access(text, text, jsonb) IS 'SECURITY: Audit logging for all student data access';

-- Verify the policies are created correctly
SELECT 
  policyname, 
  cmd::text
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;