-- Update the update_profile_as_admin function to remove role parameter
-- Roles are now exclusively managed through assign_user_role and revoke_user_role functions

CREATE OR REPLACE FUNCTION public.update_profile_as_admin(
  p_profile_id uuid,
  p_first_name text DEFAULT NULL::text,
  p_last_name text DEFAULT NULL::text,
  p_full_name text DEFAULT NULL::text,
  p_username text DEFAULT NULL::text,
  p_role text DEFAULT NULL::text, -- Kept for backwards compatibility but ignored
  p_grade_level integer DEFAULT NULL::integer,
  p_school_name text DEFAULT NULL::text,
  p_bio text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Only admins and teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  -- Update the profile WITHOUT touching the role field
  -- Role changes MUST go through assign_user_role() function
  UPDATE public.profiles
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    full_name = COALESCE(p_full_name, full_name),
    username = COALESCE(p_username, username),
    -- role field is EXCLUDED from updates
    grade_level = COALESCE(p_grade_level, grade_level),
    school_name = COALESCE(p_school_name, school_name),
    bio = COALESCE(p_bio, bio),
    updated_at = now()
  WHERE id = p_profile_id;

  -- Log the admin action
  PERFORM public.log_student_data_access('admin_update', 'update_profile_as_admin', 
    jsonb_build_object('updated_profile_id', p_profile_id));
END;
$$;

COMMENT ON FUNCTION public.update_profile_as_admin IS 'Admin function to update profile data. Role changes are NOT allowed through this function - use assign_user_role() instead.';