-- Create a function that allows students to get quiz metadata without exposing questions
CREATE OR REPLACE FUNCTION public.get_quiz_metadata(p_topic_id uuid)
RETURNS TABLE(question_count bigint, total_points bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Anyone can get metadata (count and points) without seeing actual questions
  RETURN QUERY
  SELECT 
    COUNT(*) as question_count,
    COALESCE(SUM(points), 0) as total_points
  FROM public.questions
  WHERE topic_id = p_topic_id;
END;
$$;