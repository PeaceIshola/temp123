-- Additional security hardening for profiles table
-- Create a security function to audit profile access
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- For UPDATE operations, ensure sensitive fields aren't changed inappropriately
  IF TG_OP = 'UPDATE' THEN
    -- Prevent unauthorized email changes
    IF OLD.email IS DISTINCT FROM NEW.email AND auth.uid() != OLD.user_id THEN
      RAISE EXCEPTION 'Unauthorized email modification attempt detected';
    END IF;
    
    -- Sanitize and validate input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Ensure user can only create their own profile
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Users can only create their own profiles';
    END IF;
    
    -- Sanitize input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for enhanced security monitoring
DROP TRIGGER IF EXISTS audit_profile_access_trigger ON public.profiles;
CREATE TRIGGER audit_profile_access_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access();

-- Add additional RLS policy for extra protection against policy bypass
CREATE POLICY "Block unauthorized profile access" ON public.profiles
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- Create a secure view for displaying safe profile information
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  CASE 
    WHEN auth.uid() = user_id THEN full_name
    ELSE LEFT(full_name, 1) || '***'
  END as display_name,
  role,
  grade_level,
  CASE 
    WHEN auth.uid() = user_id THEN school_name
    ELSE NULL
  END as school_name,
  created_at,
  updated_at
FROM public.profiles
WHERE auth.uid() = user_id OR role = 'teacher';

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Add data retention policy comment for future consideration
COMMENT ON TABLE public.profiles IS 'Contains sensitive student data. Consider implementing data retention policies and regular security audits.';

-- Create function to check for suspicious profile access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_profile_access()
RETURNS TABLE(user_id uuid, access_count bigint, last_access timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    accessor_user_id,
    COUNT(*) as access_count,
    MAX(accessed_at) as last_access
  FROM public.profile_access_logs
  WHERE accessed_at > NOW() - INTERVAL '1 hour'
  GROUP BY accessor_user_id
  HAVING COUNT(*) > 50
  ORDER BY access_count DESC;
$$;