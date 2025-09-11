-- Create a table to track frequently asked questions
CREATE TABLE public.frequently_asked_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  subject_code TEXT NOT NULL CHECK (subject_code IN ('BST', 'PVS', 'NV')),
  difficulty_level TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
  ask_count INTEGER NOT NULL DEFAULT 1,
  last_asked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.frequently_asked_questions ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone can view popular questions
CREATE POLICY "Everyone can view popular questions" 
ON public.frequently_asked_questions 
FOR SELECT 
USING (true);

-- Only authenticated users can increment question counts
CREATE POLICY "Authenticated users can update question counts" 
ON public.frequently_asked_questions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Teachers can manage questions
CREATE POLICY "Teachers can manage FAQ" 
ON public.frequently_asked_questions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'teacher'
));

-- Create trigger for updated_at
CREATE TRIGGER update_faq_updated_at
BEFORE UPDATE ON public.frequently_asked_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for popular questions
INSERT INTO public.frequently_asked_questions (question_text, subject_code, difficulty_level, ask_count, last_asked_at) VALUES
('Explain the functions of the digestive system', 'BST', 'Medium', 15, now() - interval '2 days'),
('List 5 farm tools and their uses', 'PVS', 'Easy', 23, now() - interval '1 day'),
('Discuss the importance of democracy in Nigeria', 'NV', 'Hard', 8, now() - interval '3 days'),
('What are the types of soil and their characteristics?', 'BST', 'Medium', 12, now() - interval '1 day'),
('Explain different methods of food preservation', 'PVS', 'Medium', 18, now() - interval '4 days'),
('What are the fundamental human rights in Nigeria?', 'NV', 'Easy', 20, now() - interval '2 days');