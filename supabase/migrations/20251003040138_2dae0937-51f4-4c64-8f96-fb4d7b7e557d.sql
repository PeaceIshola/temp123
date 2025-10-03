-- Data migration: Sync existing roles from profiles to user_roles table
-- This ensures users with roles in the old profiles.role column get proper entries in user_roles

-- Insert roles from profiles into user_roles for users who don't already have them
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  p.user_id,
  CASE 
    WHEN p.role = 'teacher' THEN 'teacher'::app_role
    WHEN p.role = 'admin' THEN 'admin'::app_role
    ELSE 'student'::app_role
  END as role,
  p.user_id as assigned_by -- Self-assigned for migration
FROM public.profiles p
WHERE p.user_id IS NOT NULL
  AND p.role IS NOT NULL
  -- Only insert if the user doesn't already have this role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
      AND ur.role = CASE 
        WHEN p.role = 'teacher' THEN 'teacher'::app_role
        WHEN p.role = 'admin' THEN 'admin'::app_role
        ELSE 'student'::app_role
      END
  );

-- Log migration results
DO $$
DECLARE
  migrated_count integer;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.user_roles
  WHERE assigned_by = user_id;
  
  RAISE NOTICE 'Migration complete: % role entries synced from profiles to user_roles', migrated_count;
END $$;