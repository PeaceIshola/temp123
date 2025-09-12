-- Create content record for the existing solution PDF that was uploaded without metadata
INSERT INTO public.content (
  topic_id,
  title,
  content,
  content_type,
  is_published,
  created_by,
  metadata
) VALUES (
  '96e8d236-a369-4279-b4e5-99f010850ae9', -- Using the Electrical Circuits topic as an example
  'Solution Guide',
  'PDF file: 1757692175358-45334.pdf',
  'pdf',
  true,
  'c57364a2-ea97-4f3e-a23c-d0358bcb3721',
  '{
    "fileName": "1757692175358-45334.pdf",
    "bucketName": "solution-pdfs",
    "area": "Basic Technology",
    "subject": "BST",
    "topic": "Electrical Circuits",
    "topicId": "96e8d236-a369-4279-b4e5-99f010850ae9"
  }'::jsonb
);