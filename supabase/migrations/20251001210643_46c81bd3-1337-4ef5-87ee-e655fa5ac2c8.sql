-- Enable students to view PDF files from storage buckets
-- Create policies for content-pdfs bucket
CREATE POLICY "Authenticated users can view content PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'content-pdfs');

-- Create policies for solution-pdfs bucket  
CREATE POLICY "Authenticated users can view solution PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'solution-pdfs');