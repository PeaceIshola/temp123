-- Create storage bucket for diagrams
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagrams', 'diagrams', true)
ON CONFLICT (id) DO NOTHING;

-- Create diagrams table
CREATE TABLE IF NOT EXISTS public.diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  sub_subject_id UUID NOT NULL REFERENCES public.sub_subjects(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_published BOOLEAN DEFAULT true
);

-- Enable RLS on diagrams table
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagrams table
CREATE POLICY "Teachers can insert diagrams"
ON public.diagrams
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can update their own diagrams"
ON public.diagrams
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can delete their own diagrams"
ON public.diagrams
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Students can view published diagrams"
ON public.diagrams
FOR SELECT
TO authenticated
USING (is_published = true);

CREATE POLICY "Teachers can view all diagrams"
ON public.diagrams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Storage policies for diagrams bucket
CREATE POLICY "Teachers can upload diagrams"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diagrams' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can update their own diagrams"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'diagrams' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can delete their own diagrams"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'diagrams' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Everyone can view diagrams"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'diagrams');

-- Create updated_at trigger for diagrams
CREATE TRIGGER update_diagrams_updated_at
BEFORE UPDATE ON public.diagrams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();