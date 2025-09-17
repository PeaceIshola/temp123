-- First, let's examine the current RLS policies on the profiles table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Now let's fix the conflicting RLS policies by removing the broad "ALL" policy
-- and keeping only the specific, restrictive policies

-- Drop the conflicting "Block unauthorized profile access" policy that uses ALL commands
DROP POLICY IF EXISTS "Block unauthorized profile access" ON public.profiles;

-- Ensure we have the correct restrictive policies in place
-- (These should already exist, but we'll recreate them to be sure)

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new, secure policies that only allow users to access their own data
CREATE POLICY "Users can view only their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a DELETE policy to prevent unauthorized deletion
CREATE POLICY "Users can delete only their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Verify the policies are correctly set up
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY cmd, policyname;