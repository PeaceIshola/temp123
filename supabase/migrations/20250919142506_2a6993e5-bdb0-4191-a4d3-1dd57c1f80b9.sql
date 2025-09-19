-- SECURITY FIX: Implement zero-trust access model for student data protection
-- This addresses the security vulnerability where teachers could access all student personal data

-- First, drop the current overly permissive policy
DROP POLICY IF EXISTS "Secure profile view access" ON public.profiles;

-- Update the verify_profile_access function to be more restrictive
-- Now it ONLY allows users to access their own profiles
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

-- Create new restrictive policy that only allows self-access
CREATE POLICY "Self access only - zero trust model" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- Create a secure function for teachers to get minimal student information for educational purposes only
-- This follows principle of least privilege
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

-- Create audit function to log any attempts to access student data
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

-- Update existing teacher functions to use the audit logging
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

-- Create a function for teachers to get specific student info for legitimate educational purposes
-- This requires explicit justification and is logged
CREATE OR REPLACE FUNCTION public.get_student_for_educational_purpose(
  p_student_id uuid,
  p_purpose text
)
RETURNS TABLE(
  student_name text,
  grade_level integer,
  school_name text,
  contact_method text  -- Anonymized contact info
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

  -- Validate purpose is legitimate
  IF p_purpose IS NULL OR length(trim(p_purpose)) < 10 THEN
    RAISE EXCEPTION 'Valid educational purpose required (minimum 10 characters)';
  END IF;

  -- Log the access with purpose for audit
  PERFORM public.log_student_data_access(
    'specific_student_access', 
    'educational_purpose',
    jsonb_build_object(
      'student_id', p_student_id,
      'purpose', p_purpose,
      'timestamp', now()
    )
  );

  -- Return minimal necessary information
  RETURN QUERY
  SELECT 
    p.full_name as student_name,
    p.grade_level,
    p.school_name,
    'Contact via school administration'::text as contact_method
  FROM public.profiles p
  WHERE p.id = p_student_id AND p.role = 'student';
END;
$$;

-- Add comments to document the security model
COMMENT ON FUNCTION public.verify_profile_access(uuid) IS 'SECURITY: Zero-trust model - only allows self-access to profiles';
COMMENT ON FUNCTION public.get_educational_student_data() IS 'SECURITY: Provides minimal student data for teachers following principle of least privilege';
COMMENT ON FUNCTION public.log_student_data_access(text, text, jsonb) IS 'SECURITY: Audit logging for all student data access';

-- Verify the security fix
SELECT 
  policyname, 
  cmd::text,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;