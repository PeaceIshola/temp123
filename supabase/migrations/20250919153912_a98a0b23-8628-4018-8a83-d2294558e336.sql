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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  -- Return all profile information for admin management
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.username,
    public.get_anonymized_email(p.email) as email,
    p.role,
    p.grade_level,
    p.school_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.role, p.full_name;
END;
$function$