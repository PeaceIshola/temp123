-- Create forum_questions table for public questions
CREATE TABLE public.forum_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_code TEXT NOT NULL,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'Medium',
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create forum_answers table for answers to questions
CREATE TABLE public.forum_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer_text TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_questions
CREATE POLICY "Everyone can view forum questions" 
ON public.forum_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create questions" 
ON public.forum_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" 
ON public.forum_questions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions" 
ON public.forum_questions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for forum_answers
CREATE POLICY "Everyone can view forum answers" 
ON public.forum_answers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create answers" 
ON public.forum_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" 
ON public.forum_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers" 
ON public.forum_answers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_forum_questions_subject_code ON public.forum_questions(subject_code);
CREATE INDEX idx_forum_questions_created_at ON public.forum_questions(created_at DESC);
CREATE INDEX idx_forum_answers_question_id ON public.forum_answers(question_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_forum_questions_updated_at
  BEFORE UPDATE ON public.forum_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_answers_updated_at
  BEFORE UPDATE ON public.forum_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();