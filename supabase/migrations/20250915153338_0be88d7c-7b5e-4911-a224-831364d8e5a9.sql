-- Create homework_help_questions table to store student questions
CREATE TABLE public.homework_help_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code text NOT NULL,
  difficulty_level text,
  question_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homework_help_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can insert their own homework questions" 
ON public.homework_help_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view their own homework questions" 
ON public.homework_help_questions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all homework questions" 
ON public.homework_help_questions 
FOR SELECT 
USING (is_teacher_or_admin());

CREATE POLICY "Teachers can update homework questions" 
ON public.homework_help_questions 
FOR UPDATE 
USING (is_teacher_or_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_homework_help_questions_updated_at
BEFORE UPDATE ON public.homework_help_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();