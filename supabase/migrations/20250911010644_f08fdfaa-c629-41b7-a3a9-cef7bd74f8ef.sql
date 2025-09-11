-- Fix security vulnerability: Students accessing quiz answers
-- Drop the problematic policy that allows students to see all question data
DROP POLICY IF EXISTS "Students can view question basics" ON public.questions;

-- Create a secure view for students that excludes sensitive data
CREATE OR REPLACE VIEW public.student_questions AS
SELECT 
  id,
  topic_id,
  question_text,
  question_type,
  options,
  points,
  difficulty_level,
  created_at
  -- Explicitly exclude: correct_answer, explanation, created_by
FROM public.questions;

-- Enable RLS on the view
ALTER VIEW public.student_questions SET (security_barrier = true);

-- Create a policy for students to access only the safe view
-- Note: Students should access questions through controlled functions, not direct queries
-- This view is for display purposes only (like showing available topics/questions)
CREATE POLICY "Students can view safe question data" ON public.questions
  FOR SELECT 
  USING (
    NOT is_teacher_or_admin()
    AND auth.uid() IS NOT NULL
    AND FALSE  -- This intentionally blocks direct access - students should use quiz functions
  );

-- Ensure teachers/admins still have full access (this policy already exists but let's make it explicit)
DROP POLICY IF EXISTS "Teachers can view all question data" ON public.questions;
CREATE POLICY "Teachers can view all question data" ON public.questions
  FOR SELECT 
  USING (is_teacher_or_admin());

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

-- Add a comment explaining the security model
COMMENT ON FUNCTION public.get_quiz_questions(UUID) IS 'Securely provides quiz questions to students without exposing answers or explanations. Students must use submit_quiz_attempt() to submit answers and get results.';

COMMENT ON FUNCTION public.submit_quiz_attempt(UUID, JSONB) IS 'Securely handles quiz submissions and returns results without exposing correct answers to students. Only teachers can see actual correct answers.';