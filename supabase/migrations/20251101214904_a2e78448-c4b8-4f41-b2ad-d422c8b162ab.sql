-- Create secure function to return quiz results with answers only after submission
CREATE OR REPLACE FUNCTION public.get_quiz_results_with_answers(
  p_topic_id uuid
)
RETURNS TABLE (
  question_id uuid,
  question_text text,
  question_type text,
  options jsonb,
  user_answer text,
  correct_answer text,
  is_correct boolean,
  explanation text,
  points integer,
  difficulty_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest_attempt_id uuid;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get the latest quiz attempt for this topic by this user
  SELECT id INTO v_latest_attempt_id
  FROM public.quiz_attempts
  WHERE user_id = auth.uid()
    AND topic_id = p_topic_id
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Verify the attempt exists and is completed
  IF v_latest_attempt_id IS NULL THEN
    RAISE EXCEPTION 'No completed quiz attempt found for this topic';
  END IF;
  
  -- Only return answers after submission is complete
  RETURN QUERY
  SELECT 
    q.id as question_id,
    q.question_text,
    q.question_type,
    to_jsonb(q.options) as options,
    (qa.answers->q.id::text)::text as user_answer,
    q.correct_answer,
    COALESCE((qa.answers->q.id::text)::text = q.correct_answer, false) as is_correct,
    q.explanation,
    q.points,
    q.difficulty_level
  FROM public.quiz_attempts qa
  JOIN public.questions q ON q.topic_id = qa.topic_id
  WHERE qa.id = v_latest_attempt_id
  ORDER BY q.created_at;
END;
$$;