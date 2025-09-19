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

  -- Delete the profile
  DELETE FROM public.profiles WHERE id = p_profile_id;
END;
$function$