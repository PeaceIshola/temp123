-- Clean up the student_questions view that triggered the security warning
-- We don't actually need this view since we're using functions instead
DROP VIEW IF EXISTS public.student_questions;

-- The security fix is already in place:
-- 1. Students cannot directly access the questions table (policy restricts to teachers/admins only)
-- 2. Students must use get_quiz_questions() function to get safe question data (no answers/explanations)
-- 3. Students must use submit_quiz_attempt() function to submit answers securely

-- Verify our security model with comments
COMMENT ON POLICY "teachers_full_access" ON public.questions IS 'Teachers and admins have full access to questions including answers and explanations';
COMMENT ON POLICY "students_no_direct_access" ON public.questions IS 'Students cannot directly query questions table - they must use get_quiz_questions() and submit_quiz_attempt() functions';