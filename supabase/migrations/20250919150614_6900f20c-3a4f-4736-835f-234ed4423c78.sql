-- Update the get_students_for_teacher function to include admin role
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(student_id uuid, full_name text, grade_level integer, school_name text, anonymized_email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Teacher or admin access required';
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

-- Update the is_teacher_or_admin function to include admin role
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  );
END;
$$;