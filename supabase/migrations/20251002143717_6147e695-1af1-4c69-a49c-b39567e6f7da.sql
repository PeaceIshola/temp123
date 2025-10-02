-- Enhanced security measures for profiles table to prevent enumeration attacks (Fixed)

-- 1. Create a function to detect and prevent rapid profile access (rate limiting)
CREATE OR REPLACE FUNCTION public.check_profile_access_rate()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_access_count INTEGER;
  suspicious_pattern BOOLEAN := false;
BEGIN
  -- Only check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;

  -- Check if user has accessed too many different profiles recently (5 minutes)
  SELECT COUNT(DISTINCT accessed_user_id) INTO recent_access_count
  FROM public.profile_access_logs
  WHERE accessor_user_id = auth.uid()
    AND accessed_at > NOW() - INTERVAL '5 minutes'
    AND access_type IN ('SELECT', 'READ');
  
  -- If more than 10 different profiles accessed in 5 minutes, flag as suspicious
  IF recent_access_count > 10 THEN
    suspicious_pattern := true;
    
    -- Log the suspicious activity
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'SUSPICIOUS_ENUMERATION_DETECTED',
      inet_client_addr()
    );
  END IF;
  
  RETURN NOT suspicious_pattern;
END;
$$;

-- 2. Create a table for privacy settings
CREATE TABLE IF NOT EXISTS public.profile_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hide_full_name BOOLEAN DEFAULT false,
  hide_school_name BOOLEAN DEFAULT false,
  hide_grade_level BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on privacy settings
ALTER TABLE public.profile_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own privacy settings
CREATE POLICY "Users manage own privacy settings"
ON public.profile_privacy_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create a secure function to get profile display with privacy controls
CREATE OR REPLACE FUNCTION public.get_secure_profile_display(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  role text,
  grade_level integer,
  school_name text,
  is_own_profile boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  privacy_settings RECORD;
  is_teacher BOOLEAN;
BEGIN
  -- Rate limiting check
  IF NOT public.check_profile_access_rate() THEN
    RAISE EXCEPTION 'Too many profile access attempts. Please try again later.';
  END IF;

  -- Check if requester is a teacher
  is_teacher := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
  
  -- Get privacy settings (if they exist)
  SELECT * INTO privacy_settings
  FROM public.profile_privacy_settings
  WHERE user_id = target_user_id;
  
  -- Return profile with privacy controls applied
  RETURN QUERY
  SELECT 
    p.id,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.full_name
      WHEN is_teacher THEN p.full_name
      WHEN privacy_settings.hide_full_name THEN 'Anonymous User'
      ELSE COALESCE(LEFT(p.full_name, 1) || '***', 'Anonymous')
    END as display_name,
    p.role,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.grade_level
      WHEN is_teacher THEN p.grade_level
      WHEN privacy_settings.hide_grade_level THEN NULL
      ELSE p.grade_level
    END as grade_level,
    CASE 
      WHEN auth.uid() = p.user_id THEN p.school_name
      WHEN is_teacher THEN p.school_name
      WHEN privacy_settings.hide_school_name THEN NULL
      ELSE NULL
    END as school_name,
    (auth.uid() = p.user_id) as is_own_profile
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- 4. Create a function for admins to review suspicious activities
CREATE OR REPLACE FUNCTION public.get_suspicious_activities()
RETURNS TABLE(
  user_id uuid,
  activity_type text,
  activity_count bigint,
  first_occurrence timestamp with time zone,
  last_occurrence timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins and teachers can view this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  RETURN QUERY
  SELECT 
    accessor_user_id,
    access_type,
    COUNT(*) as activity_count,
    MIN(accessed_at) as first_occurrence,
    MAX(accessed_at) as last_occurrence
  FROM public.profile_access_logs
  WHERE access_type IN ('SUSPICIOUS_ENUMERATION_DETECTED', 'ENUMERATION_ATTACK_DETECTED', 'BLOCKED_BY_RLS')
    AND accessed_at > NOW() - INTERVAL '7 days'
  GROUP BY accessor_user_id, access_type
  ORDER BY activity_count DESC;
END;
$$;

-- 5. Update existing profile access functions to use rate limiting
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(student_id uuid, full_name text, grade_level integer, school_name text, anonymized_email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is a teacher or admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Teacher or admin access required';
  END IF;

  -- Rate limiting check
  IF NOT public.check_profile_access_rate() THEN
    RAISE EXCEPTION 'Too many access attempts. Please try again later.';
  END IF;

  -- Log the access for audit purposes
  PERFORM public.log_student_data_access('read', 'get_students_for_teacher');

  -- Return student information without exposing full emails
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.grade_level,
    p.school_name,
    public.get_anonymized_email(p.email) as anonymized_email
  FROM public.profiles p
  WHERE p.role = 'student';
END;
$$;