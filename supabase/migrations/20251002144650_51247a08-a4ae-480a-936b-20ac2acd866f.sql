-- Explicitly deny public access to profiles table to protect student information

-- 1. Create explicit DENY policies for unauthenticated users
-- This makes security intent crystal clear and prevents any public access loopholes

-- Deny public SELECT (viewing) access
CREATE POLICY "Block public read access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny public INSERT (creation) access
CREATE POLICY "Block public insert access to profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (false);

-- Deny public UPDATE (modification) access
CREATE POLICY "Block public update access to profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Deny public DELETE access
CREATE POLICY "Block public delete access to profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);

-- 2. Apply the same protection to other sensitive tables

-- Protect profile_privacy_settings from public access
CREATE POLICY "Block public access to privacy settings"
ON public.profile_privacy_settings
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Protect sensitive_profile_data from public access
CREATE POLICY "Block public access to sensitive data"
ON public.sensitive_profile_data
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Protect profile_access_logs from public access
CREATE POLICY "Block public access to access logs"
ON public.profile_access_logs
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. Protect other student-related sensitive data

-- Forum questions (student homework and questions)
CREATE POLICY "Block public access to forum questions"
ON public.forum_questions
FOR SELECT
TO anon
USING (false);

-- Homework help questions
CREATE POLICY "Block public access to homework questions"
ON public.homework_help_questions
FOR SELECT
TO anon
USING (false);

-- Quiz attempts (contains student performance data)
CREATE POLICY "Block public access to quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO anon
USING (false);

-- Homework submissions (contains student work)
CREATE POLICY "Block public access to homework submissions"
ON public.homework_submissions
FOR SELECT
TO anon
USING (false);

-- 4. Create a security audit function to verify RLS coverage
CREATE OR REPLACE FUNCTION public.verify_rls_protection()
RETURNS TABLE(
  table_name text,
  has_rls_enabled boolean,
  has_public_deny_policy boolean,
  security_status text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins and teachers can run security audits
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  RETURN QUERY
  SELECT 
    t.tablename::text,
    (t.relrowsecurity)::boolean as has_rls_enabled,
    EXISTS(
      SELECT 1 FROM pg_policies p 
      WHERE p.schemaname = 'public' 
      AND p.tablename = t.tablename 
      AND p.roles @> ARRAY['anon']
    ) as has_public_deny_policy,
    CASE 
      WHEN NOT t.relrowsecurity THEN 'CRITICAL: RLS Not Enabled'
      WHEN NOT EXISTS(
        SELECT 1 FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = t.tablename 
        AND p.roles @> ARRAY['anon']
      ) THEN 'WARNING: No explicit public deny policy'
      ELSE 'SECURE: RLS enabled with public deny'
    END as security_status
  FROM pg_catalog.pg_tables t
  LEFT JOIN pg_catalog.pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  ORDER BY 
    CASE 
      WHEN NOT t.relrowsecurity THEN 1
      WHEN NOT EXISTS(
        SELECT 1 FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = t.tablename 
        AND p.roles @> ARRAY['anon']
      ) THEN 2
      ELSE 3
    END;
END;
$$;

-- 5. Create function to log and block suspicious public access attempts
CREATE OR REPLACE FUNCTION public.log_public_access_attempt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the public access attempt
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    NULL, -- No user ID for public attempts
    NULL,
    'BLOCKED_PUBLIC_ACCESS_ATTEMPT',
    inet_client_addr()
  );
  
  -- Check if there are multiple attempts from same IP
  DECLARE
    ip_attempts integer;
  BEGIN
    SELECT COUNT(*) INTO ip_attempts
    FROM public.profile_access_logs
    WHERE access_type = 'BLOCKED_PUBLIC_ACCESS_ATTEMPT'
      AND ip_address = inet_client_addr()
      AND accessed_at > NOW() - INTERVAL '1 hour';
    
    -- If more than 10 attempts from same IP in 1 hour, create admin alert
    IF ip_attempts > 10 THEN
      INSERT INTO public.admin_tickets (
        created_by,
        title,
        description,
        priority,
        category,
        status
      ) VALUES (
        (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
        'Suspicious Public Access Attempts Detected',
        format('IP address %s attempted public access to protected data %s times in the last hour', 
               inet_client_addr(), ip_attempts),
        'high',
        'security',
        'open'
      );
    END IF;
  END;
END;
$$;

-- 6. Add comments documenting the security model
COMMENT ON TABLE public.profiles IS 
'Student and teacher personal information. RLS ENABLED. Public access explicitly DENIED. Only authenticated users can view their own profiles. Teachers have limited access to student data through specific security definer functions.';

COMMENT ON COLUMN public.profiles.email IS 
'SENSITIVE: Email addresses are protected. Access only through get_user_email_secure() function with full audit logging.';

COMMENT ON COLUMN public.profiles.full_name IS 
'SENSITIVE: Student full names. Access restricted by RLS policies and privacy settings.';

COMMENT ON COLUMN public.profiles.school_name IS 
'SENSITIVE: School information. Could be used to identify and target students.';

COMMENT ON TABLE public.profile_privacy_settings IS 
'User privacy controls. RLS ENABLED. Public access DENIED. Only users can manage their own settings.';