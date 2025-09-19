-- Allow admin to call educational data functions and add counts RPC
CREATE OR REPLACE FUNCTION public.get_educational_student_data()
RETURNS TABLE(student_id text, display_name text, grade_level integer, school_name text, role_verified text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  -- Return only minimal educational data needed for teaching purposes
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

CREATE OR REPLACE FUNCTION public.get_student_list_for_teacher()
RETURNS TABLE(student_name text, grade_level integer, school_name text, role_verified text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

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

CREATE OR REPLACE FUNCTION public.get_admin_overview_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_count integer := 0;
  teacher_count integer := 0;
  ticket_count integer := 0;
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  SELECT COUNT(*) INTO student_count FROM public.profiles WHERE role = 'student';
  SELECT COUNT(*) INTO teacher_count FROM public.profiles WHERE role = 'teacher';
  SELECT COUNT(*) INTO ticket_count FROM public.admin_tickets;

  RETURN jsonb_build_object(
    'studentCount', student_count,
    'teacherCount', teacher_count,
    'ticketCount', ticket_count
  );
END;
$$;