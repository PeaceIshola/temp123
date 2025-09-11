-- Create a function to increment question count and update last_asked_at
CREATE OR REPLACE FUNCTION public.increment_question_count(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.frequently_asked_questions
  SET 
    ask_count = ask_count + 1,
    last_asked_at = now()
  WHERE id = question_id;
END;
$$;