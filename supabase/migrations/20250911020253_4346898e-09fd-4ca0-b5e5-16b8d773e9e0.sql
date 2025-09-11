-- Create solutions table for storing detailed answer keys and explanations
CREATE TABLE public.solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  solution_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'step_by_step', 'video', 'document'
  title TEXT NOT NULL,
  solution_content TEXT NOT NULL,
  additional_resources JSONB DEFAULT '[]'::jsonb, -- Links, files, etc.
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

-- Create policies for solutions
CREATE POLICY "Teachers can manage all solutions" 
ON public.solutions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'teacher'
));

CREATE POLICY "Students can view published solutions" 
ON public.solutions 
FOR SELECT 
USING (is_published = true);

-- Create trigger for updated_at
CREATE TRIGGER update_solutions_updated_at
BEFORE UPDATE ON public.solutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();