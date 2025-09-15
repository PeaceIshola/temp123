-- Drop the problematic views
DROP VIEW IF EXISTS public.forum_questions_public;
DROP VIEW IF EXISTS public.forum_answers_public;

-- Create secure functions instead of views to avoid security definer issues
CREATE OR REPLACE FUNCTION public.get_public_forum_questions()
RETURNS TABLE(
  id uuid,
  title text,
  question_text text,
  subject_code text,
  difficulty_level text,
  is_answered boolean,
  created_at timestamptz,
  tags text[],
  posted_by text,
  anonymous_id text,
  is_own_question boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    'Anonymous Student'::text as posted_by,
    ('Student #' || abs(hashtext(fq.user_id::text) % 9999))::text as anonymous_id,
    CASE WHEN fq.user_id = auth.uid() THEN true ELSE false END as is_own_question
  FROM public.forum_questions fq
  ORDER BY fq.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_forum_answers(p_question_id uuid)
RETURNS TABLE(
  id uuid,
  question_id uuid,
  answer_text text,
  is_accepted boolean,
  votes integer,
  created_at timestamptz,
  posted_by text,
  anonymous_id text,
  is_own_answer boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.question_id,
    fa.answer_text,
    fa.is_accepted,
    fa.votes,
    fa.created_at,
    'Anonymous Student'::text as posted_by,
    ('Student #' || abs(hashtext(fa.user_id::text) % 9999))::text as anonymous_id,
    CASE WHEN fa.user_id = auth.uid() THEN true ELSE false END as is_own_answer
  FROM public.forum_answers fa
  WHERE fa.question_id = p_question_id
  ORDER BY fa.is_accepted DESC, fa.votes DESC, fa.created_at ASC;
END;
$$;