-- Critical Security Fix: Implement Proper Role-Based Access Control
-- This migration creates a secure user roles system to prevent privilege escalation

-- Step 1: Create enum type for roles (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Step 3: Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 4: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Drop and recreate trigger to block role changes in profiles table
DROP TRIGGER IF EXISTS block_profile_role_changes ON public.profiles;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow initial insert
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'student'; -- Force all new profiles to student
    RETURN NEW;
  END IF;
  
  -- Block any role updates
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Direct role changes not allowed. Use user_roles table instead.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER block_profile_role_changes
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_changes();

-- Step 6: Update is_teacher_or_admin function to use new system
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  );
$$;

-- Step 7: Update get_profiles_for_admin function
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE(profile_id uuid, user_id uuid, full_name text, first_name text, last_name text, username text, email text, role text, grade_level integer, school_name text, bio text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.username,
    COALESCE(
      public.get_anonymized_email(spd.encrypted_email),
      'No email'
    ) as email,
    COALESCE(
      (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.user_id LIMIT 1),
      'student'
    ) as role,
    p.grade_level,
    p.school_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.sensitive_profile_data spd ON p.user_id = spd.user_id
  ORDER BY p.full_name;
END;
$$;

-- Step 8: Update other critical functions
CREATE OR REPLACE FUNCTION public.get_students_for_teacher()
RETURNS TABLE(student_id uuid, full_name text, grade_level integer, school_name text, anonymized_email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'teacher') AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Teacher or admin access required';
  END IF;

  IF NOT public.check_profile_access_rate() THEN
    RAISE EXCEPTION 'Too many access attempts. Please try again later.';
  END IF;

  PERFORM public.log_student_data_access('read', 'get_students_for_teacher');

  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.grade_level,
    p.school_name,
    COALESCE(
      public.get_anonymized_email(spd.encrypted_email),
      'Anonymous'
    ) as anonymized_email
  FROM public.profiles p
  LEFT JOIN public.sensitive_profile_data spd ON p.user_id = spd.user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'student'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_list_for_teacher()
RETURNS TABLE(student_name text, grade_level integer, school_name text, role_verified text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'teacher') AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Teacher or admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.full_name as student_name,
    p.grade_level,
    p.school_name,
    'student'::TEXT as role_verified
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'student'
  )
  ORDER BY p.full_name;
END;
$$;

-- Update handle_new_user to use new roles system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'student'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.sensitive_profile_data (user_id, encrypted_email, email_hash)
  VALUES (
    NEW.id,
    NEW.email,
    public.hash_email(NEW.email)
  );
  
  RETURN NEW;
END;
$$;