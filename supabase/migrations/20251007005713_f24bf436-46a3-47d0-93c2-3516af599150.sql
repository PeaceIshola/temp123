-- Fix role mismatches in the database
-- Clear existing incorrect role assignments
DELETE FROM public.user_roles 
WHERE user_id IN (
  '625f25fd-ce3e-449a-8523-abdc35f082c9',  -- Peace Ishola (should be student)
  'c57364a2-ea97-4f3e-a23c-d0358bcb3721'   -- Tomi Ishola (should be teacher)
);

-- Assign correct roles based on profiles table role column
-- Peace Ishola should be student (profile says student)
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('625f25fd-ce3e-449a-8523-abdc35f082c9', 'student', '625f25fd-ce3e-449a-8523-abdc35f082c9')
ON CONFLICT (user_id, role) DO NOTHING;

-- Tomi Ishola should be teacher (profile says teacher)
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('c57364a2-ea97-4f3e-a23c-d0358bcb3721', 'teacher', 'c57364a2-ea97-4f3e-a23c-d0358bcb3721')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add a function to sync roles from profiles to user_roles for existing users
CREATE OR REPLACE FUNCTION public.sync_profile_roles_to_user_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For all profiles with a role, ensure user_roles matches
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  SELECT 
    p.user_id,
    CASE 
      WHEN p.role = 'admin' THEN 'admin'::app_role
      WHEN p.role = 'teacher' THEN 'teacher'::app_role
      ELSE 'student'::app_role
    END,
    p.user_id
  FROM public.profiles p
  WHERE p.role IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Remove any user_roles that don't match the profile role
  DELETE FROM public.user_roles ur
  USING public.profiles p
  WHERE ur.user_id = p.user_id
    AND ur.role::text != p.role;
END;
$$;

-- Run the sync function
SELECT public.sync_profile_roles_to_user_roles();