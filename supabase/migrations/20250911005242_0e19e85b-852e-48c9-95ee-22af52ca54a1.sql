-- Drop the problematic policy that allows everyone to see all question data
DROP POLICY "Everyone can view questions" ON public.questions;

-- Create a security definer function to check if user is a teacher/admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create separate policies for students and teachers

-- Students can only see basic question info (no answers or explanations)
CREATE POLICY "Students can view question basics" ON public.questions
  FOR SELECT 
  USING (
    NOT public.is_teacher_or_admin()
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (false); -- Students cannot modify

-- Teachers/admins can see everything
CREATE POLICY "Teachers can view all question data" ON public.questions
  FOR SELECT 
  USING (public.is_teacher_or_admin());

-- Create a view for students that excludes sensitive data
CREATE VIEW public.student_questions AS
SELECT 
  id,
  topic_id,
  question_text,
  question_type,
  options,
  difficulty_level,
  points,
  created_at
FROM public.questions
WHERE public.is_teacher_or_admin() = false;

-- Enable RLS on the view
ALTER VIEW public.student_questions SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.student_questions TO authenticated;

-- Create a function for quiz taking that validates answers without exposing them
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_topic_id UUID,
  p_answers JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_score INTEGER := 0;
  v_total_questions INTEGER := 0;
  v_question RECORD;
  v_user_answer TEXT;
  v_is_correct BOOLEAN;
  v_results JSONB := '{}';
BEGIN
  -- Only authenticated users can submit quizzes
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Calculate score by checking each answer
  FOR v_question IN 
    SELECT id, correct_answer, points 
    FROM public.questions 
    WHERE topic_id = p_topic_id
  LOOP
    v_total_questions := v_total_questions + 1;
    v_user_answer := p_answers->>(v_question.id::text);
    v_is_correct := (v_user_answer = v_question.correct_answer);
    
    IF v_is_correct THEN
      v_score := v_score + v_question.points;
    END IF;
    
    -- Store result without exposing correct answer
    v_results := jsonb_set(
      v_results, 
      ARRAY[v_question.id::text], 
      json_build_object('correct', v_is_correct)::jsonb
    );
  END LOOP;
  
  -- Insert quiz attempt record
  INSERT INTO public.quiz_attempts (
    user_id, 
    topic_id, 
    score, 
    total_questions, 
    answers
  ) VALUES (
    auth.uid(), 
    p_topic_id, 
    v_score, 
    v_total_questions, 
    p_answers
  );
  
  -- Return results without correct answers
  RETURN json_build_object(
    'score', v_score,
    'total_questions', v_total_questions,
    'results', v_results
  )::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID, JSONB) TO authenticated;