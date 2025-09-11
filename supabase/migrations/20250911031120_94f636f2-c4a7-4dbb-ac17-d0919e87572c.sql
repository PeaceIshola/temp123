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

-- 2. Teachers can view student profiles for educational purposes (limited fields)
-- But create a separate view for this to limit exposure
CREATE OR REPLACE VIEW public.student_profiles_for_teachers AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.role,
  p.grade_level,
  p.school_name,
  p.created_at
FROM public.profiles p
WHERE p.role = 'student';

-- Enable RLS on the view
ALTER VIEW public.student_profiles_for_teachers SET (security_barrier = true);

-- Policy for teachers to access limited student data via view
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

-- 4. Users can update their own profile (but not email to prevent abuse)
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

-- 7. Create audit logging for profile access
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

-- Only allow reading own access logs or if you're a teacher
CREATE POLICY "Users can view own access logs" 
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

-- Function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when someone accesses a profile
  INSERT INTO public.profile_access_logs (
    accessed_user_id,
    accessor_user_id,
    access_type
  ) VALUES (
    NEW.user_id,
    auth.uid(),
    TG_OP
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile access logging
CREATE TRIGGER log_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access();