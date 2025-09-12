-- Security Fix: Protect Student Email Addresses from Unauthorized Access

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Teachers can view student profiles safely" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view limited student info" ON public.profiles;

-- Create a secure policy that completely blocks teachers from direct profile access
-- Teachers must use security definer functions instead
CREATE POLICY "Users can only view own profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Update the existing student list function to be more secure
-- This replaces the problematic direct table access
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(
  student_id uuid, 
  full_name text, 
  grade_level integer, 
  school_name text, 
  anonymized_email text
)
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