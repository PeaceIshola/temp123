-- Drop the old constraints that are causing conflicts
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS question_question_type_check;

-- Add a single unified check constraint with all allowed question types
ALTER TABLE public.questions 
ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'essay'));

-- Add comment to document the allowed values
COMMENT ON COLUMN public.questions.question_type IS 'Allowed values: multiple_choice, true_false, fill_blank, short_answer, essay';