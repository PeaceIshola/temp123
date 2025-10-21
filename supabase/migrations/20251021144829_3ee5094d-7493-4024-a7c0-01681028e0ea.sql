-- Fix storage policies to allow teachers to list and view their uploaded files
-- The issue is that the existing policies check profiles table which has strict RLS
-- We'll use a helper function instead that can bypass RLS checks

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Teachers can view content PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view solution PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete content files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete solution files" ON storage.objects;

-- Create new policies that work correctly
-- For listing/viewing content PDFs (teachers need this to see their uploads)
CREATE POLICY "Teachers can list and view content PDFs"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'content-pdfs' 
  AND is_teacher_or_admin()
);

-- For listing/viewing solution PDFs
CREATE POLICY "Teachers can list and view solution PDFs"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'solution-pdfs' 
  AND is_teacher_or_admin()
);

-- For deleting content PDFs
CREATE POLICY "Teachers can delete content PDFs"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'content-pdfs' 
  AND is_teacher_or_admin()
);

-- For deleting solution PDFs
CREATE POLICY "Teachers can delete solution PDFs"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'solution-pdfs' 
  AND is_teacher_or_admin()
);