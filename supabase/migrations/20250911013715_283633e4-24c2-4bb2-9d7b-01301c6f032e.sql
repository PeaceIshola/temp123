-- Update admin user back to teacher role
UPDATE public.profiles 
SET role = 'teacher' 
WHERE user_id = 'c57364a2-ea97-4f3e-a23c-d0358bcb3721';

-- Update RLS policies to remove admin references
DROP POLICY IF EXISTS "Teachers can manage all content" ON public.content;
CREATE POLICY "Teachers can manage all content" 
ON public.content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'teacher'
));

-- Update is_teacher_or_admin function to only check for teacher
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  );
END;
$$;