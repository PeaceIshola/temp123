-- Security Fix: Protect Student Email Addresses from Unauthorized Access
-- Remove the overly permissive policy that exposes student emails to teachers

-- Drop the problematic policy that allows teachers to see all student data
DROP POLICY IF EXISTS "Teachers can view student profiles safely" ON public.profiles;

-- Create a secure function that returns only non-sensitive student information for teachers
CREATE OR REPLACE FUNCTION public.get_student_display_info(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  role text,
  grade_level integer,
  school_name text,
  anonymized_email text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Teachers only';
  END IF;

  -- Return limited, non-sensitive student information
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.role,
    p.grade_level,
    p.school_name,
    public.get_anonymized_email(p.email) as anonymized_email
  FROM public.profiles p
  WHERE p.user_id = p_user_id AND p.role = 'student';
END;
$$;

-- Create a new, more restrictive policy for teachers
-- Teachers can only see limited student information, not full profiles
CREATE POLICY "Teachers can view limited student info"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    get_current_user_role() = 'teacher' 
    AND role = 'student' 
    AND FALSE  -- This forces use of the security definer function instead
  )
);

-- Ensure the existing policies remain for self-access
-- Users can still view and update their own profiles
-- The "Users can view own profile only" policy already handles this correctly