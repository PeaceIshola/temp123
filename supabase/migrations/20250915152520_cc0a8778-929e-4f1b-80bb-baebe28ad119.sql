-- Fix security vulnerability: Restrict flashcards access to authenticated users only
-- Drop the current public policy that allows anyone to view flashcards
DROP POLICY IF EXISTS "Everyone can view flashcards" ON public.flashcards;

-- Create new policy requiring authentication to view flashcards
CREATE POLICY "Authenticated users can view flashcards" 
ON public.flashcards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep the existing teacher management policy unchanged
-- (Teachers can manage flashcards policy already exists and should remain)