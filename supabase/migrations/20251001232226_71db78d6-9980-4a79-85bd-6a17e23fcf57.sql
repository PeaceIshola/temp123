-- Add Information and Communication Technology back to BST subject
INSERT INTO public.sub_subjects (subject_id, name, description)
SELECT 
  id,
  'Information and Communication Technology',
  'Learn about computers, internet, and digital technology'
FROM public.subjects
WHERE code = 'BST'
ON CONFLICT DO NOTHING;