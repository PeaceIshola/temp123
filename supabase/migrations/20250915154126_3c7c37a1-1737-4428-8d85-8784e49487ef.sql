-- Add teacher response fields to homework_help_questions table
ALTER TABLE public.homework_help_questions 
ADD COLUMN teacher_response text,
ADD COLUMN teacher_id uuid REFERENCES auth.users(id),
ADD COLUMN responded_at timestamp with time zone;