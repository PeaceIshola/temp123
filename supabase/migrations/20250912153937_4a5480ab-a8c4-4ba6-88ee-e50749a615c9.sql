-- Drop the existing content_type check constraint
ALTER TABLE public.content DROP CONSTRAINT content_content_type_check;

-- Create a new constraint that includes 'pdf'
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check 
CHECK (content_type = ANY (ARRAY['note'::text, 'homework_guide'::text, 'experiment'::text, 'video'::text, 'worksheet'::text, 'project'::text, 'pdf'::text]));

-- Now create the content record for the existing uploaded PDF
INSERT INTO public.content (
  topic_id,
  title,
  content,
  content_type,
  is_published,
  created_by,
  metadata
) VALUES (
  '96e8d236-a369-4279-b4e5-99f010850ae9',
  'Electrical Circuits PDF',
  'PDF file: 1757691199061-gff.pdf',
  'pdf',
  true,
  'c57364a2-ea97-4f3e-a23c-d0358bcb3721',
  '{
    "fileName": "1757691199061-gff.pdf",
    "bucketName": "content-pdfs",
    "area": "Basic Technology",
    "subject": "BST",
    "topic": "Electrical Circuits",
    "topicId": "96e8d236-a369-4279-b4e5-99f010850ae9",
    "subjectId": "4864f046-9f32-4163-92c5-9db31fba0ff3",
    "subSubjectId": "8ee1a3fb-4fe9-4eef-a4ca-8958665aeac3"
  }'::jsonb
);