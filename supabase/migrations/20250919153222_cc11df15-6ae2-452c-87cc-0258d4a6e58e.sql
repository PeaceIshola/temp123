CREATE OR REPLACE FUNCTION public.update_profile_as_admin(
  p_profile_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_grade_level integer DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_bio text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins and teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  -- Update the profile with provided values
  UPDATE public.profiles
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    full_name = COALESCE(p_full_name, full_name),
    username = COALESCE(p_username, username),
    role = COALESCE(p_role, role),
    grade_level = COALESCE(p_grade_level, grade_level),
    school_name = COALESCE(p_school_name, school_name),
    bio = COALESCE(p_bio, bio),
    updated_at = now()
  WHERE id = p_profile_id;

  -- Log the admin action
  PERFORM public.log_student_data_access('admin_update', 'update_profile_as_admin', 
    jsonb_build_object('updated_profile_id', p_profile_id));
END;
$function$