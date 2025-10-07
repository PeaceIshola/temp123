-- Fix critical security vulnerability: Remove policy that allows self-role-assignment
-- This prevents users from granting themselves admin/teacher privileges

-- Drop the vulnerable policy that allows users to assign roles to themselves
DROP POLICY IF EXISTS "Allow system to assign roles during user creation" ON public.user_roles;

-- The "Block all direct inserts to user_roles" policy already exists and will prevent all client-side inserts
-- The handle_new_user() trigger function is SECURITY DEFINER, so it bypasses RLS and can still assign the default 'student' role
-- Only the assign_user_role() function (admin-only) can assign other roles

-- Verify the blocking policy exists (this should already be in place)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Block all direct inserts to user_roles'
  ) THEN
    CREATE POLICY "Block all direct inserts to user_roles"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (false);
  END IF;
END $$;