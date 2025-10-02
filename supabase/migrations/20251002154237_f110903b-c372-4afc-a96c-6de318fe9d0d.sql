-- ========================================
-- FIX: Remove Unused safe_profile_view to Eliminate Security Risk
-- ========================================
-- The view is not used in the application and has been replaced by
-- secure functions (get_safe_profile_for_user, get_safe_profile, etc.)
-- that query the profiles table directly with proper access controls.
-- Dropping the view removes potential attack surface.

-- Drop the view
DROP VIEW IF EXISTS public.safe_profile_view CASCADE;

-- Add comment documenting the removal
COMMENT ON FUNCTION public.get_safe_profile_for_user(uuid) IS
'SECURE: Primary method for accessing profile data without email exposure.
This function replaces the deprecated safe_profile_view.
- Users can access their own profile
- Teachers/admins can access student profiles with logging
- Email is never returned
- All access is audited and rate-limited
- Enumeration attacks are detected and blocked';

-- Document why the view was removed
-- (This will be in migration history for future reference)
DO $$
BEGIN
  RAISE NOTICE 'safe_profile_view removed - replaced by secure functions with proper access controls';
  RAISE NOTICE 'Use get_safe_profile_for_user() for safe profile access';
END $$;