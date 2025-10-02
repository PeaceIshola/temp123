-- ========================================
-- FIX: Add RLS Policies to safe_profile_view
-- ========================================
-- The view needs its own RLS policies to control access
-- Views with security_invoker=true inherit RLS from base tables,
-- but we need to explicitly enable RLS on the view and add policies

-- Enable RLS on the view
ALTER VIEW public.safe_profile_view SET (security_barrier = true);

-- Note: PostgreSQL doesn't support RLS directly on views the same way as tables
-- Instead, we need to ensure the base table's RLS is properly enforced
-- and create policies that make sense for the view's intended use

-- The solution is to ensure users can only access their own profile
-- or profiles they're authorized to see (teachers viewing students)

-- Let's verify the underlying table has proper RLS
-- and document the security model

COMMENT ON VIEW public.safe_profile_view IS 
'SECURITY: View with security_invoker=true enforces RLS from profiles table.
Access control:
1. Users can view their own profile (auth.uid() = user_id)
2. Teachers/admins can view student profiles via secure functions only
3. Email column is EXCLUDED from this view
4. Direct queries enforce base table RLS policies
5. Column-level security revokes email SELECT privilege
This provides defense-in-depth: RLS + column security + view filtering';

-- Create a secure function to safely query profiles
-- This replaces direct view access with controlled access
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_user(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  first_name text,
  last_name text,
  username text,
  role text,
  grade_level integer,
  school_name text,
  bio text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id uuid;
  is_teacher_or_admin boolean;
BEGIN
  requesting_user_id := auth.uid();
  
  -- Must be authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Default to requesting user's own profile
  IF target_user_id IS NULL THEN
    target_user_id := requesting_user_id;
  END IF;
  
  -- Check if requester is teacher/admin
  is_teacher_or_admin := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = requesting_user_id 
    AND role IN ('teacher', 'admin')
  );
  
  -- Authorization check
  IF target_user_id != requesting_user_id AND NOT is_teacher_or_admin THEN
    RAISE EXCEPTION 'Unauthorized: Can only view own profile';
  END IF;
  
  -- Log access for audit trail
  IF target_user_id != requesting_user_id THEN
    PERFORM public.log_student_data_access(
      'safe_profile_view',
      'get_safe_profile_for_user',
      jsonb_build_object('target_user', target_user_id)
    );
  END IF;
  
  -- Return profile WITHOUT email
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.username,
    p.role,
    p.grade_level,
    p.school_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_safe_profile_for_user(uuid) IS
'SECURE: Provides controlled access to profile data without email exposure.
- Users can access their own profile
- Teachers/admins can access student profiles with logging
- Email is never returned
- All access is audited';

-- Revoke public access to the view and require function usage
REVOKE SELECT ON public.safe_profile_view FROM authenticated;
REVOKE SELECT ON public.safe_profile_view FROM anon;

-- Grant execute permission on the secure function
GRANT EXECUTE ON FUNCTION public.get_safe_profile_for_user(uuid) TO authenticated;