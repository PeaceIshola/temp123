-- Create function for admin to update any profile
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

-- Create function for admin to delete any profile
CREATE OR REPLACE FUNCTION public.delete_profile_as_admin(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only admins and teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  -- Get the user_id before deletion for cascade cleanup
  SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Log the admin action before deletion
  PERFORM public.log_student_data_access('admin_delete', 'delete_profile_as_admin', 
    jsonb_build_object('deleted_profile_id', p_profile_id, 'deleted_user_id', v_user_id));

  -- Delete the profile (this will cascade to related records via foreign keys)
  DELETE FROM public.profiles WHERE id = p_profile_id;
  
  -- Also delete the auth user if needed (optional - be careful with this)
  -- DELETE FROM auth.users WHERE id = v_user_id;
END;
$function$