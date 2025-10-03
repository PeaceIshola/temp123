-- Update Peace Ishola's role to teacher in user_roles table only
-- The profiles.role column is now read-only and managed by triggers

-- Remove student role
DELETE FROM public.user_roles
WHERE user_id = '625f25fd-ce3e-449a-8523-abdc35f082c9'
  AND role = 'student';

-- Add teacher role
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('625f25fd-ce3e-449a-8523-abdc35f082c9', 'teacher', '625f25fd-ce3e-449a-8523-abdc35f082c9')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the change
SELECT user_id, role FROM public.user_roles 
WHERE user_id = '625f25fd-ce3e-449a-8523-abdc35f082c9';