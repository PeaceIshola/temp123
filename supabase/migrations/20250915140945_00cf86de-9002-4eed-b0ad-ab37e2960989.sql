-- Create flashcards table for study materials
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies for flashcards
CREATE POLICY "Everyone can view flashcards" 
ON public.flashcards 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers can manage flashcards" 
ON public.flashcards 
FOR ALL 
USING (is_teacher_or_admin())
WITH CHECK (is_teacher_or_admin());

-- Create function to update timestamps
CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create study progress table to track flashcard study sessions
CREATE TABLE public.flashcard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  last_studied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS for progress tracking
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for flashcard progress
CREATE POLICY "Users can view their own flashcard progress" 
ON public.flashcard_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard progress" 
ON public.flashcard_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard progress" 
ON public.flashcard_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for flashcard progress timestamps
CREATE TRIGGER update_flashcard_progress_updated_at
BEFORE UPDATE ON public.flashcard_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();