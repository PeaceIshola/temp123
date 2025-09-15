-- Fix security issue: Restrict forum_answers SELECT access to authenticated users only
-- Currently the table allows public read access with a 'true' condition
-- This should be restricted to authenticated users while maintaining the anonymized public functions

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Users can view answers anonymously" ON public.forum_answers;

-- Create a new policy that requires authentication for direct table access
CREATE POLICY "Authenticated users can view answers" 
ON public.forum_answers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- The public access is still available through the secure get_public_forum_answers() function
-- which properly anonymizes the data, but direct table access now requires authentication