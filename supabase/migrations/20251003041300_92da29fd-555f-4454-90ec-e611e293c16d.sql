-- Fix infinite recursion in user_roles RLS policies
-- The issue: policies were checking user_roles to determine if user is admin, causing recursion

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Keep only the simple self-access policy that doesn't cause recursion
-- Users can view their own roles (no recursion here)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- For admin access to all roles, we'll use the secure functions instead
-- This prevents recursion while maintaining security