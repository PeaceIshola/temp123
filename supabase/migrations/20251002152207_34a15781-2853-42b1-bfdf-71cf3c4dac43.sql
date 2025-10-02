-- ========================================
-- FIX: Update admin functions for new email storage
-- ========================================
-- Update functions that accessed email from profiles table
-- to use sensitive_profile_data instead

-- Update get_profiles_for_admin to get emails from sensitive storage
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE(
  profile_id uuid,
  user_id uuid,
  full_name text,
  first_name text,
  last_name text,
  username text,
  email text,
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
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  -- Return all profile information with anonymized emails
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.username,
    COALESCE(
      public.get_anonymized_email(spd.encrypted_email),
      'No email'
    ) as email,
    p.role,
    p.grade_level,
    p.school_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.sensitive_profile_data spd ON p.user_id = spd.user_id
  ORDER BY p.role, p.full_name;
END;
$$;

-- Update get_students_for_teacher to use sensitive storage
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(
  student_id uuid,
  full_name text,
  grade_level integer,
  school_name text,
  anonymized_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Teacher or admin access required';
  END IF;

  -- Rate limiting check
  IF NOT public.check_profile_access_rate() THEN
    RAISE EXCEPTION 'Too many access attempts. Please try again later.';
  END IF;

  -- Log the access for audit purposes
  PERFORM public.log_student_data_access('read', 'get_students_for_teacher');

  -- Return student information with anonymized emails from secure storage
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.grade_level,
    p.school_name,
    COALESCE(
      public.get_anonymized_email(spd.encrypted_email),
      'Anonymous'
    ) as anonymized_email
  FROM public.profiles p
  LEFT JOIN public.sensitive_profile_data spd ON p.user_id = spd.user_id
  WHERE p.role = 'student';
END;
$$;

-- Update get_teachers_for_admin to use sensitive storage
CREATE OR REPLACE FUNCTION public.get_teachers_for_admin()
RETURNS TABLE(
  teacher_id uuid,
  full_name text,
  first_name text,
  last_name text,
  email text,
  school_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  -- Return teacher information with anonymized emails
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    p.full_name,
    p.first_name,
    p.last_name,
    COALESCE(
      public.get_anonymized_email(spd.encrypted_email),
      'Anonymous'
    ) as email,
    p.school_name,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.sensitive_profile_data spd ON p.user_id = spd.user_id
  WHERE p.role = 'teacher'
  ORDER BY p.full_name;
END;
$$;

COMMENT ON FUNCTION public.get_profiles_for_admin() IS
'ADMIN/TEACHER: Returns all profiles with anonymized emails from secure storage. Email data never exposed in plain text.';

COMMENT ON FUNCTION public.get_students_for_teacher() IS
'TEACHER: Returns student list with anonymized emails from secure storage. All access logged.';

COMMENT ON FUNCTION public.get_teachers_for_admin() IS
'ADMIN/TEACHER: Returns teacher list with anonymized emails from secure storage.';