-- Remove the old constraint and add a new one that allows grades 1-12
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_grade_level_check;

-- Add new constraint that allows grades 1-12
ALTER TABLE public.profiles ADD CONSTRAINT profiles_grade_level_check 
CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 12));