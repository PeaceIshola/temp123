-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_quiz_results_with_answers(uuid);

-- Create secure RPC function to return quiz results with answers only after submission
CREATE OR REPLACE FUNCTION get_quiz_results_with_answers(p_attempt_id uuid)
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
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the attempt exists, belongs to the user, and is completed
  IF NOT EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE id = p_attempt_id
    AND user_id = auth.uid()
    AND completed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Invalid or incomplete quiz attempt';
  END IF;
  
  -- Return answers only after submission is complete
  RETURN QUERY
  SELECT 
    q.id as question_id,
    q.question_text,
    q.question_type,
    q.options,
    (qa.answers->q.id::text)::text as user_answer,
    q.correct_answer,
    (qa.answers->q.id::text)::text = q.correct_answer as is_correct,
    q.explanation,
    q.points,
    q.difficulty_level
  FROM quiz_attempts qa
  JOIN questions q ON q.topic_id = qa.topic_id
  WHERE qa.id = p_attempt_id
  ORDER BY q.id;
END;
$$;