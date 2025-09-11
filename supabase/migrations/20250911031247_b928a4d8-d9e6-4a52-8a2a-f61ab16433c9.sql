-- Fix security warnings from the previous migration

-- 1. Remove the security definer view and replace with a safer approach
DROP VIEW IF EXISTS public.student_info_for_teachers;

-- 2. Update functions to have proper search path settings
CREATE OR REPLACE FUNCTION public.get_safe_user_display(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  role TEXT,
  grade_level INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe, non-sensitive information
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name as display_name,
    p.role,
    p.grade_level
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

-- 3. Update email anonymization function with proper settings
CREATE OR REPLACE FUNCTION public.get_anonymized_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Return only first character + *** + domain
  IF email IS NULL OR email = '' THEN
    RETURN 'Anonymous';
  END IF;
  
  RETURN LEFT(email, 1) || '***@' || SPLIT_PART(email, '@', 2);
END;
$$;

-- 4. Update the teacher function with proper settings
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(
  student_id UUID,
  full_name TEXT,
  grade_level INTEGER,
  school_name TEXT,
  anonymized_email TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

-- 5. Create a safer alternative to the view - a function that teachers can call
CREATE OR REPLACE FUNCTION public.get_student_list_for_teacher()
RETURNS TABLE(
  student_name TEXT,
  grade_level INTEGER,
  school_name TEXT,
  role_verified TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

  -- Return limited student information for educational purposes only
  RETURN QUERY
  SELECT 
    p.full_name as student_name,
    p.grade_level,
    p.school_name,
    'student'::TEXT as role_verified
  FROM public.profiles p
  WHERE p.role = 'student'
  ORDER BY p.full_name;
END;
$$;