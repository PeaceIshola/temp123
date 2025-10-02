-- Fix the submit_quiz_attempt function to return total points instead of question count
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_topic_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score INTEGER := 0;
  v_total_points INTEGER := 0;
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
    v_total_points := v_total_points + v_question.points;
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
  
  -- Return results with total points (not just question count)
  RETURN json_build_object(
    'score', v_score,
    'total_questions', v_total_points,
    'results', v_results
  )::jsonb;
END;
$$;