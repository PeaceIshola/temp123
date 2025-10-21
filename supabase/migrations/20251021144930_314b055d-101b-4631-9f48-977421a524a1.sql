-- Drop ALL existing teacher storage policies first
DROP POLICY IF EXISTS "Teachers can view content PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view solution PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete solution files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can list and view content PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can list and view solution PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete content PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete solution PDFs" ON storage.objects;

-- Now create the correct policies using the is_teacher_or_admin() function
-- This function uses SECURITY DEFINER so it bypasses the strict RLS on profiles

-- For content-pdfs bucket
CREATE POLICY "Teachers full access to content PDFs"
ON storage.objects FOR ALL
TO public
USING (
  bucket_id = 'content-pdfs' 
  AND is_teacher_or_admin()
)
WITH CHECK (
  bucket_id = 'content-pdfs' 
  AND is_teacher_or_admin()
);

-- For solution-pdfs bucket  
CREATE POLICY "Teachers full access to solution PDFs"
ON storage.objects FOR ALL
TO public
USING (
  bucket_id = 'solution-pdfs' 
  AND is_teacher_or_admin()
)
WITH CHECK (
  bucket_id = 'solution-pdfs' 
  AND is_teacher_or_admin()
);