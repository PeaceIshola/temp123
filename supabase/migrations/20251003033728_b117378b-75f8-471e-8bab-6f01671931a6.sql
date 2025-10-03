-- Critical Security Fix: Prevent Privilege Escalation in user_roles table
-- This migration adds restrictive policies and a secure function for role assignments

-- Step 1: Drop the existing permissive "Admins can manage all roles" policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Step 2: Create RESTRICTIVE policy to block all direct INSERTs
CREATE POLICY "Block all direct inserts to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (false);

-- Step 3: Create RESTRICTIVE policy to block unauthorized UPDATEs
CREATE POLICY "Block all direct updates to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

-- Step 4: Create RESTRICTIVE policy to block unauthorized DELETEs
CREATE POLICY "Block all direct deletes to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);

-- Step 5: Create PERMISSIVE policies for admins (SELECT only)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Step 6: Create secure server-side function for role assignment
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role app_role,
  assignment_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigning_user_id uuid;
  assigning_user_role app_role;
  result jsonb;
BEGIN
  -- Get the user making the assignment
  assigning_user_id := auth.uid();
  
  -- Security check: Must be authenticated
  IF assigning_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Security check: Must be an admin to assign roles
  SELECT role INTO assigning_user_role
  FROM public.user_roles
  WHERE user_id = assigning_user_id AND role = 'admin'
  LIMIT 1;
  
  IF assigning_user_role IS NULL THEN
    -- Log unauthorized attempt
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      assigning_user_id,
      target_user_id,
      'UNAUTHORIZED_ROLE_ASSIGNMENT_ATTEMPT',
      inet_client_addr()
    );
    
    RAISE EXCEPTION 'Access denied: Only admins can assign roles';
  END IF;
  
  -- Validation: Ensure target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Validation: Ensure role is valid
  IF new_role NOT IN ('admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Validation: Prevent self-promotion to admin (extra security layer)
  IF assigning_user_id = target_user_id AND new_role = 'admin' THEN
    -- Log suspicious self-promotion attempt
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      assigning_user_id,
      target_user_id,
      'SUSPICIOUS_SELF_PROMOTION_ATTEMPT',
      inet_client_addr()
    );
    
    RAISE EXCEPTION 'Security violation: Cannot promote yourself to admin';
  END IF;
  
  -- Insert the role assignment
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, assigning_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log successful role assignment
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    assigning_user_id,
    target_user_id,
    'ROLE_ASSIGNED_' || new_role::text,
    inet_client_addr()
  );
  
  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', new_role,
    'assigned_by', assigning_user_id,
    'reason', assignment_reason
  );
  
  RETURN result;
END;
$$;

-- Step 7: Create secure function to revoke roles
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  target_user_id uuid,
  role_to_revoke app_role,
  revocation_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  revoking_user_id uuid;
  revoking_user_role app_role;
  result jsonb;
BEGIN
  -- Get the user making the revocation
  revoking_user_id := auth.uid();
  
  -- Security check: Must be authenticated
  IF revoking_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Security check: Must be an admin to revoke roles
  SELECT role INTO revoking_user_role
  FROM public.user_roles
  WHERE user_id = revoking_user_id AND role = 'admin'
  LIMIT 1;
  
  IF revoking_user_role IS NULL THEN
    -- Log unauthorized attempt
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      revoking_user_id,
      target_user_id,
      'UNAUTHORIZED_ROLE_REVOCATION_ATTEMPT',
      inet_client_addr()
    );
    
    RAISE EXCEPTION 'Access denied: Only admins can revoke roles';
  END IF;
  
  -- Validation: Prevent revoking your own admin role (last admin protection)
  IF revoking_user_id = target_user_id AND role_to_revoke = 'admin' THEN
    -- Check if this is the last admin
    DECLARE
      admin_count integer;
    BEGIN
      SELECT COUNT(*) INTO admin_count
      FROM public.user_roles
      WHERE role = 'admin';
      
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot revoke the last admin role';
      END IF;
    END;
  END IF;
  
  -- Delete the role assignment
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_to_revoke;
  
  -- Log successful role revocation
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    revoking_user_id,
    target_user_id,
    'ROLE_REVOKED_' || role_to_revoke::text,
    inet_client_addr()
  );
  
  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', role_to_revoke,
    'revoked_by', revoking_user_id,
    'reason', revocation_reason
  );
  
  RETURN result;
END;
$$;

-- Step 8: Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role, text) TO authenticated;

-- Step 9: Add comment for security documentation
COMMENT ON TABLE public.user_roles IS 'User roles table with RESTRICTIVE RLS policies. Role assignments MUST go through assign_user_role() function. Direct INSERTs are blocked to prevent privilege escalation.';

COMMENT ON FUNCTION public.assign_user_role IS 'Secure function for assigning roles. Only admins can call this. Includes validation and audit logging.';

COMMENT ON FUNCTION public.revoke_user_role IS 'Secure function for revoking roles. Only admins can call this. Includes validation and audit logging.';