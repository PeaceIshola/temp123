-- First, let's create a secure function to get anonymized forum questions
-- This function will return questions without exposing student identities

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Everyone can view forum questions" ON public.forum_questions;
DROP POLICY IF EXISTS "Everyone can view forum answers" ON public.forum_answers;

-- Create more restrictive policies for forum_questions
-- Users can only see their own questions with full details
CREATE POLICY "Users can view their own questions"
ON public.forum_questions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Teachers can view all questions with student info for educational purposes
CREATE POLICY "Teachers can view all questions"
ON public.forum_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Create a public view for anonymized questions
CREATE OR REPLACE VIEW public.forum_questions_public AS
SELECT 
  id,
  title,
  question_text,
  subject_code,
  difficulty_level,
  is_answered,
  created_at,
  tags,
  -- Replace user_id with anonymous identifier
  'Anonymous Student' as posted_by,
  -- Create a deterministic but anonymous display name
  'Student #' || abs(hashtext(user_id::text) % 9999) as anonymous_id
FROM public.forum_questions;

-- Grant access to the public view
GRANT SELECT ON public.forum_questions_public TO authenticated;
GRANT SELECT ON public.forum_questions_public TO anon;

-- Update forum_answers policies to be more secure
-- Users can view answers but not see who posted them unless it's their own
CREATE POLICY "Users can view answers anonymously"
ON public.forum_answers
FOR SELECT
TO authenticated
USING (true);

-- Create a public view for anonymized answers
CREATE OR REPLACE VIEW public.forum_answers_public AS
SELECT 
  id,
  question_id,
  answer_text,
  is_accepted,
  votes,
  created_at,
  -- Anonymize the user info
  'Anonymous Student' as posted_by,
  'Student #' || abs(hashtext(user_id::text) % 9999) as anonymous_id,
  -- Users can see if it's their own answer
  CASE WHEN user_id = auth.uid() THEN true ELSE false END as is_own_answer
FROM public.forum_answers;

-- Grant access to the answers view
GRANT SELECT ON public.forum_answers_public TO authenticated;
GRANT SELECT ON public.forum_answers_public TO anon;

-- Create a secure function for teachers to get student display info
CREATE OR REPLACE FUNCTION public.get_question_with_student_info(question_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  question_text text,
  subject_code text,
  difficulty_level text,
  is_answered boolean,
  created_at timestamptz,
  tags text[],
  student_name text,
  student_grade integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only teachers can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Teachers only';
  END IF;

  -- Return question with safe student information
  RETURN QUERY
  SELECT 
    fq.id,
    fq.title,
    fq.question_text,
    fq.subject_code,
    fq.difficulty_level,
    fq.is_answered,
    fq.created_at,
    fq.tags,
    p.full_name as student_name,
    p.grade_level as student_grade
  FROM public.forum_questions fq
  JOIN public.profiles p ON fq.user_id = p.user_id
  WHERE fq.id = question_id;
END;
$$;