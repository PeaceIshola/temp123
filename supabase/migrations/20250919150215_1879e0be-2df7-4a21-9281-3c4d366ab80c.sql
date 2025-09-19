-- Create a function to get teacher list for admin dashboard
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

  -- Return teacher information
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    p.full_name,
    p.first_name,
    p.last_name,
    public.get_anonymized_email(p.email) as email,
    p.school_name,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.role = 'teacher'
  ORDER BY p.full_name;
END;
$$;