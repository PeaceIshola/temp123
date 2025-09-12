-- Fix content table RLS so students can see published content
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Everyone can view published content" ON public.content;
DROP POLICY IF EXISTS "Teachers can manage all content" ON public.content;

-- Recreate policies as PERMISSIVE (default)
CREATE POLICY "Everyone can view published content"
ON public.content
FOR SELECT
USING (is_published = true);

CREATE POLICY "Teachers can view all content"
ON public.content
FOR SELECT
USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can insert content"
ON public.content
FOR INSERT
WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update content"
ON public.content
FOR UPDATE
USING (public.is_teacher_or_admin())
WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete content"
ON public.content
FOR DELETE
USING (public.is_teacher_or_admin());