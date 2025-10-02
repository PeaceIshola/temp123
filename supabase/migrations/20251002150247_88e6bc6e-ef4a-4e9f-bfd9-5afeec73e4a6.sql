-- ========================================
-- FIX: User Email Addresses Exposure
-- ========================================
-- Remove direct SELECT access to the email column for authenticated users
-- Email access will only be available through secure functions with proper logging

-- Step 1: Revoke SELECT privilege on email column from authenticated users
-- This prevents any direct SELECT queries from accessing emails
REVOKE SELECT (email) ON public.profiles FROM authenticated;
REVOKE SELECT (email) ON public.profiles FROM anon;

-- Step 2: Create a secure view for profile data WITHOUT email
CREATE OR REPLACE VIEW public.safe_profile_view AS
SELECT 
  id,
  user_id,
  full_name,
  first_name,
  last_name,
  username,
  role,
  grade_level,
  school_name,
  bio,
  created_at,
  updated_at
  -- email column is explicitly EXCLUDED
FROM public.profiles;

-- Step 3: Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.safe_profile_view TO authenticated;

-- Step 4: Update the existing secure email access function to be the ONLY way to get emails
-- This function already has proper logging and access controls
COMMENT ON FUNCTION public.get_user_email_secure(uuid) IS 
'SECURITY: This is the ONLY approved method for accessing user emails. All access is logged and restricted to: 1) Users accessing their own email, 2) Teachers/admins accessing anonymized versions for legitimate educational purposes.';

-- Step 5: Document the security model
COMMENT ON COLUMN public.profiles.email IS 
'PROTECTED: Direct SELECT access revoked. Access only via get_user_email_secure() function with audit logging.';

-- Step 6: Create a helper function for users to get their own email safely
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can call this
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Return only the user's own email
  RETURN (
    SELECT email 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.get_my_email() IS 
'Allows authenticated users to retrieve their own email address only. No logging required as users accessing their own data is not a security concern.';

-- Step 7: Ensure admin functions maintain their access for legitimate operations
-- The security definer functions already have elevated privileges and can still access email