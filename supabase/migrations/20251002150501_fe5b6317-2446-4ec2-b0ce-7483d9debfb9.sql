-- ========================================
-- FIX: Security Definer View Issue
-- ========================================
-- Views bypass RLS by default. We need to recreate the view with
-- security_invoker = true to ensure RLS policies are enforced

-- Drop the existing view
DROP VIEW IF EXISTS public.safe_profile_view;

-- Recreate the view with SECURITY INVOKER option
-- This ensures the view executes with the permissions of the calling user,
-- properly enforcing RLS policies
CREATE VIEW public.safe_profile_view
WITH (security_invoker = true)
AS
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
  -- email column is explicitly EXCLUDED for security
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.safe_profile_view TO authenticated;

-- Add documentation
COMMENT ON VIEW public.safe_profile_view IS 
'SECURITY: View with security_invoker=true to enforce RLS. Provides safe profile data without email exposure. All queries execute with caller permissions, ensuring proper RLS enforcement.';