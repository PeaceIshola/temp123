-- Fix infinite recursion in profiles RLS policies
-- First, create a security definer function to safely get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view student profiles limited" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

-- Create new safe policies without recursion
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student profiles safely" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow if viewing own profile OR if current user is a teacher viewing a student
  auth.uid() = user_id 
  OR 
  (public.get_current_user_role() = 'teacher' AND role = 'student')
);