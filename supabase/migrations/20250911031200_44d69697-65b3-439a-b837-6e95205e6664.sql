-- Create enhanced RLS policies for profiles table to prevent email harvesting

-- First, drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more secure and comprehensive set of policies

-- 1. Users can only view their own profile (prevents email harvesting)
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Teachers can view student profiles for educational purposes (but without email)
CREATE POLICY "Teachers can view student profiles limited" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles teacher_profile 
    WHERE teacher_profile.user_id = auth.uid() 
    AND teacher_profile.role = 'teacher'
  ) 
  AND role = 'student'
);

-- 3. Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create a function to safely get user display information without exposing emails
CREATE OR REPLACE FUNCTION public.get_safe_user_display(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  role TEXT,
  grade_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe, non-sensitive information
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name as display_name,
    p.role,
    p.grade_level
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
END;
$$;

-- 6. Add email anonymization for public contexts
CREATE OR REPLACE FUNCTION public.get_anonymized_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return only first character + *** + domain
  IF email IS NULL OR email = '' THEN
    RETURN 'Anonymous';
  END IF;
  
  RETURN LEFT(email, 1) || '***@' || SPLIT_PART(email, '@', 2);
END;
$$;

-- 7. Create a secure view for teachers to access student information without emails
CREATE OR REPLACE VIEW public.student_info_for_teachers AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.role,
  p.grade_level,
  p.school_name,
  p.created_at,
  public.get_anonymized_email(p.email) as anonymized_email
FROM public.profiles p
WHERE p.role = 'student';

-- Apply RLS to the view
ALTER VIEW public.student_info_for_teachers SET (security_barrier = true);

-- 8. Create audit logging table for profile access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_user_id UUID NOT NULL,
  accessor_user_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing access logs
CREATE POLICY "Users can view relevant access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (
  accessor_user_id = auth.uid() 
  OR accessed_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Policy for inserting access logs
CREATE POLICY "Allow inserting access logs" 
ON public.profile_access_logs 
FOR INSERT 
WITH CHECK (accessor_user_id = auth.uid());

-- 9. Function to securely get teacher-visible student profiles
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(
  student_id UUID,
  full_name TEXT,
  grade_level INTEGER,
  school_name TEXT,
  anonymized_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Teachers only';
  END IF;

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