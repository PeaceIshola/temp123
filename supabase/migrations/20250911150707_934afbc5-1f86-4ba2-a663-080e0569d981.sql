-- Create storage buckets for PDF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('content-pdfs', 'content-pdfs', false),
  ('solution-pdfs', 'solution-pdfs', false);

-- Create RLS policies for content PDFs
CREATE POLICY "Teachers can upload content PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'content-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can view content PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'content-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Students can view content PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'content-pdfs');

-- Create RLS policies for solution PDFs  
CREATE POLICY "Teachers can upload solution PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'solution-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can view solution PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'solution-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Students can view solution PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'solution-pdfs');