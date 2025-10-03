-- Enable RLS on subscriptions_backup table
ALTER TABLE public.subscriptions_backup ENABLE ROW LEVEL SECURITY;

-- Add restrictive policy - only admins/teachers can access backup
CREATE POLICY "Only admins can view backup"
ON public.subscriptions_backup
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
));