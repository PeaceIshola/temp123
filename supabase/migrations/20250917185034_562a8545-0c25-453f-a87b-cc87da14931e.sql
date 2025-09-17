-- First, let's see what policies currently exist
\d+ public.profiles

-- Let's check the policies specifically
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive::text,
  roles::text,
  cmd::text,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Now let's strengthen the security by adding additional protection measures
-- Create a more secure function to verify profile access
CREATE OR REPLACE FUNCTION public.verify_profile_access(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access if it's the user's own profile OR user is a teacher
  RETURN (
    auth.uid() = profile_user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );
END;
$$;

-- Drop existing policies and recreate with enhanced security
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete only their own profile" ON public.profiles;

-- Create ultra-restrictive policies with additional safeguards
CREATE POLICY "Secure profile view access" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  verify_profile_access(user_id)
);

CREATE POLICY "Secure profile insert access" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND
  -- Prevent insertion of sensitive data without proper validation
  email IS NOT NULL AND
  length(trim(email)) > 0
);

CREATE POLICY "Secure profile update access" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND
  -- Prevent unauthorized email changes
  (OLD.email = NEW.email OR auth.uid() = user_id)
);

-- No DELETE policy - profiles should not be deletable to maintain data integrity
-- and prevent accidental data loss

-- Verify the new policies
SELECT 
  policyname, 
  cmd::text,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;