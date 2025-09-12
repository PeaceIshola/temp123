-- Insert subjects
INSERT INTO public.subjects (code, name, description) VALUES 
('BST', 'Basic Science & Technology (BST)', 'Master the fundamentals of science, technology, ICT, and physical health education'),
('PVS', 'Prevocational Studies (PVS)', 'Explore practical skills in agriculture and home economics for everyday life'),
('NV', 'National Values Education (NV)', 'Build strong civic awareness and understanding of Nigerian society')
ON CONFLICT (code) DO NOTHING;

-- Insert sub-subjects for BST
INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Basic Science', 'Fundamental science concepts', s.id 
FROM public.subjects s WHERE s.code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Basic Technology', 'Technology and engineering basics', s.id 
FROM public.subjects s WHERE s.code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'ICT', 'Information and Communication Technology', s.id 
FROM public.subjects s WHERE s.code = 'BST'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'PHE', 'Physical and Health Education', s.id 
FROM public.subjects s WHERE s.code = 'BST'
ON CONFLICT DO NOTHING;

-- Insert sub-subjects for PVS
INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Agriculture', 'Agricultural practices and farming', s.id 
FROM public.subjects s WHERE s.code = 'PVS'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Home Economics', 'Home management and domestic skills', s.id 
FROM public.subjects s WHERE s.code = 'PVS'
ON CONFLICT DO NOTHING;

-- Insert sub-subjects for NV
INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Civic Education', 'Citizenship and governance', s.id 
FROM public.subjects s WHERE s.code = 'NV'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Social Studies', 'Society and culture studies', s.id 
FROM public.subjects s WHERE s.code = 'NV'
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_subjects (name, description, subject_id) 
SELECT 'Security Education', 'Safety and security awareness', s.id 
FROM public.subjects s WHERE s.code = 'NV'
ON CONFLICT DO NOTHING;