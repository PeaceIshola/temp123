-- Insert sub-subjects for BST (Basic Science & Technology)
INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Basic Science', 'Fundamental science concepts and principles'
FROM public.subjects WHERE code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Basic Technology', 'Introduction to technology and engineering'
FROM public.subjects WHERE code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'ICT', 'Information and Communication Technology'
FROM public.subjects WHERE code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'PHE', 'Physical and Health Education'
FROM public.subjects WHERE code = 'BST'
ON CONFLICT DO NOTHING;

-- Insert sub-subjects for PVS (Prevocational Studies)
INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Agriculture', 'Crop production and animal husbandry'
FROM public.subjects WHERE code = 'PVS'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Home Economics', 'Home management and life skills'
FROM public.subjects WHERE code = 'PVS'
ON CONFLICT DO NOTHING;

-- Insert sub-subjects for NV (National Values Education)
INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Civic Education', 'Citizenship and democratic principles'
FROM public.subjects WHERE code = 'NV'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Social Studies', 'Nigerian society and culture'
FROM public.subjects WHERE code = 'NV'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (subject_id, name, description) 
SELECT id, 'Security Education', 'Safety and security awareness'
FROM public.subjects WHERE code = 'NV'
ON CONFLICT DO NOTHING;

-- Insert topics for Basic Science
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Photosynthesis', 'How plants make their own food', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'Basic Science'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Human Body Systems', 'Understanding how our body works', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'Basic Science'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Energy & Forces', 'Understanding motion and energy', 3
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'Basic Science'
ON CONFLICT DO NOTHING;

-- Insert topics for Basic Technology
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Simple Machines', 'Levers, pulleys, and wheels', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'Basic Technology'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Electrical Circuits', 'Understanding electricity basics', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'Basic Technology'
ON CONFLICT DO NOTHING;

-- Insert topics for ICT
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Computer Basics', 'Introduction to computers', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'ICT'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Internet Safety', 'Safe online practices', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'BST' AND ss.name = 'ICT'
ON CONFLICT DO NOTHING;

-- Insert topics for Agriculture
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Crop Production', 'Growing and caring for crops', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'PVS' AND ss.name = 'Agriculture'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Animal Husbandry', 'Caring for farm animals', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'PVS' AND ss.name = 'Agriculture'
ON CONFLICT DO NOTHING;

-- Insert topics for Home Economics
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Nutrition', 'Healthy eating and food preparation', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'PVS' AND ss.name = 'Home Economics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Home Management', 'Managing household resources', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'PVS' AND ss.name = 'Home Economics'
ON CONFLICT DO NOTHING;

-- Insert topics for Civic Education
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Democracy', 'Understanding democratic principles', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Civic Education'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Rights & Duties', 'Citizen rights and responsibilities', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Civic Education'
ON CONFLICT DO NOTHING;

-- Insert topics for Social Studies
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Nigerian Culture', 'Understanding Nigerian traditions', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Social Studies'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Geography', 'Nigerian geography and regions', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Social Studies'
ON CONFLICT DO NOTHING;

-- Insert topics for Security Education
INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Safety Tips', 'Personal and community safety', 1
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Security Education'
ON CONFLICT DO NOTHING;

INSERT INTO public.topics (sub_subject_id, title, description, order_index)
SELECT ss.id, 'Emergency Response', 'What to do in emergencies', 2
FROM public.sub_subjects ss
JOIN public.subjects s ON ss.subject_id = s.id
WHERE s.code = 'NV' AND ss.name = 'Security Education'
ON CONFLICT DO NOTHING;