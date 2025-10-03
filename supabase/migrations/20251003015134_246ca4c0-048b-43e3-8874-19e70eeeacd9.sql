-- Backup existing subscriptions data
CREATE TABLE IF NOT EXISTS public.subscriptions_backup AS 
SELECT * FROM public.subscriptions;

-- Drop existing subscriptions table and recreate with new structure
DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  user_name text,
  subscriptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
));

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from backup
INSERT INTO public.subscriptions (user_id, user_name, subscriptions)
SELECT 
  sb.user_id,
  p.full_name,
  jsonb_agg(
    jsonb_build_object(
      'subject_id', sb.subject_id,
      'subscription_type', sb.subscription_type,
      'status', sb.status,
      'started_at', sb.started_at,
      'expires_at', sb.expires_at
    )
  ) as subscriptions
FROM public.subscriptions_backup sb
LEFT JOIN public.profiles p ON sb.user_id = p.user_id
GROUP BY sb.user_id, p.full_name
ON CONFLICT (user_id) DO NOTHING;

-- Create helper function to check subscription status
CREATE OR REPLACE FUNCTION public.check_user_subject_subscription(p_user_id uuid, p_subject_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription jsonb;
  v_status text := 'none';
BEGIN
  -- Get user's subscriptions
  SELECT subscriptions INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = p_user_id;
  
  IF v_subscription IS NULL THEN
    RETURN 'none';
  END IF;
  
  -- Check each subscription in the array
  FOR v_subscription IN 
    SELECT * FROM jsonb_array_elements(
      (SELECT subscriptions FROM public.subscriptions WHERE user_id = p_user_id)
    )
  LOOP
    IF (v_subscription->>'subject_id')::uuid = p_subject_id 
       AND v_subscription->>'status' = 'active'
       AND (v_subscription->>'expires_at' IS NULL 
            OR (v_subscription->>'expires_at')::timestamp > now())
    THEN
      RETURN v_subscription->>'subscription_type';
    END IF;
  END LOOP;
  
  RETURN 'none';
END;
$$;