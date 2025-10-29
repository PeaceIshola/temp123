-- Drop the existing check constraint on questions table
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS question_question_type_check;

-- Add updated check constraint to allow all question types used in the form
ALTER TABLE public.questions 
ADD CONSTRAINT question_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'short_answer'));

-- Add comment to document the allowed values
COMMENT ON COLUMN public.questions.question_type IS 'Allowed values: multiple_choice, true_false, fill_blank, short_answer';