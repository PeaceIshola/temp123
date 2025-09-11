-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.subscriptions 
ADD CONSTRAINT fk_subscriptions_subject 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'teacher'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to prevent duplicate subscriptions
ALTER TABLE public.subscriptions 
ADD CONSTRAINT unique_user_subject_subscription 
UNIQUE (user_id, subject_id);

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION public.check_subscription_status(p_subject_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_type TEXT := 'none';
BEGIN
  -- Only authenticated users can check subscription status
  IF auth.uid() IS NULL THEN
    RETURN 'none';
  END IF;
  
  -- Check if user has an active subscription
  SELECT subscription_type INTO v_subscription_type
  FROM public.subscriptions
  WHERE user_id = auth.uid()
    AND subject_id = p_subject_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
    
  RETURN COALESCE(v_subscription_type, 'none');
END;
$$;