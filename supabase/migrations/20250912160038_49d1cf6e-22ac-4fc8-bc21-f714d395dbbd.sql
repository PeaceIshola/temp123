-- Clean up duplicate SELECT policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Keep only the secure policy that restricts access to own profile
-- The "Users can only view own profiles" policy is now the only SELECT policy