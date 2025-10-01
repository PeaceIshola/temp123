-- Delete the old short name entries (ICT and PHE)
-- This will keep only the full names that already exist
DELETE FROM public.sub_subjects
WHERE name = 'ICT' OR name = 'PHE';