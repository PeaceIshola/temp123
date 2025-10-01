-- Allow teachers to create topics
CREATE POLICY "Teachers can create topics"
ON public.topics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Allow teachers to update topics
CREATE POLICY "Teachers can update topics"
ON public.topics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Allow teachers to delete topics
CREATE POLICY "Teachers can delete topics"
ON public.topics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);