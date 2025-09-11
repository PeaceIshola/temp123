-- Fix security vulnerability: Students accessing quiz answers
-- First, let's see what policies exist and clean them up properly

-- Drop ALL existing policies on questions table to start fresh
DROP POLICY IF EXISTS "Students can view question basics" ON public.questions;
DROP POLICY IF EXISTS "Students can view safe question data" ON public.questions;
DROP POLICY IF EXISTS "Teachers can view all question data" ON public.questions;
DROP POLICY IF EXISTS "Teachers can manage questions" ON public.questions;

-- Create a secure function for students to get quiz questions (without answers)
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_topic_id UUID)
RETURNS TABLE (
  id UUID,
  topic_id UUID,
  question_text TEXT,
  question_type TEXT,
  options JSONB,
  points INTEGER,
  difficulty_level INTEGER
) AS $$
BEGIN
  -- Only authenticated users can get quiz questions
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Students can only get basic question data (no answers or explanations)
  RETURN QUERY
  SELECT 
    q.id,
    q.topic_id,
    q.question_text,
    q.question_type,
    q.options,
    q.points,
    q.difficulty_level
  FROM public.questions q
  WHERE q.topic_id = p_topic_id
  ORDER BY q.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(UUID) TO authenticated;

-- Now create the proper policies
-- Teachers/admins get full access to everything
CREATE POLICY "teachers_full_access" ON public.questions
  FOR ALL 
  USING (is_teacher_or_admin())
  WITH CHECK (is_teacher_or_admin());

-- Students get NO direct access to the questions table
-- They must use the get_quiz_questions() function instead
CREATE POLICY "students_no_direct_access" ON public.questions
  FOR SELECT 
  USING (
    is_teacher_or_admin() -- Only teachers/admins can access directly
  );

-- Add comments explaining the security model
COMMENT ON FUNCTION public.get_quiz_questions(UUID) IS 'Securely provides quiz questions to students without exposing answers or explanations. Students must use submit_quiz_attempt() to submit answers and get results.';

COMMENT ON FUNCTION public.submit_quiz_attempt(UUID, JSONB) IS 'Securely handles quiz submissions and returns results without exposing correct answers to students. Only teachers can see actual correct answers.';

COMMENT ON TABLE public.questions IS 'Quiz questions table. Students cannot access this directly - they must use get_quiz_questions() function for safe access without answers/explanations.';