-- Create storage policies for content-pdfs bucket

-- Teachers can upload files
CREATE POLICY "Teachers can upload content files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'content-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Teachers can delete files they uploaded
CREATE POLICY "Teachers can delete content files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'content-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Students and teachers can view/download files
CREATE POLICY "Authenticated users can view content files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'content-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Create storage policies for solution-pdfs bucket

-- Teachers can upload solution files
CREATE POLICY "Teachers can upload solution files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'solution-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Teachers can delete solution files
CREATE POLICY "Teachers can delete solution files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'solution-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Students and teachers can view/download solution files
CREATE POLICY "Authenticated users can view solution files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'solution-pdfs' 
  AND auth.uid() IS NOT NULL
);