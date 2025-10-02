-- Drop function with CASCADE to remove dependent RLS policy, then recreate both
DROP FUNCTION IF EXISTS public.check_content_access(uuid) CASCADE;

CREATE FUNCTION public.check_content_access(p_content_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subject_id uuid;
  v_has_subscription boolean;
BEGIN
  -- Teachers and admins have full access
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RETURN true;
  END IF;
  
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the subject_id for this content
  SELECT s.id INTO v_subject_id
  FROM public.content c
  INNER JOIN public.topics t ON c.topic_id = t.id
  INNER JOIN public.sub_subjects ss ON t.sub_subject_id = ss.id
  INNER JOIN public.subjects s ON ss.subject_id = s.id
  WHERE c.id = p_content_id;
  
  -- Check if user has an active subscription (free OR premium) for this subject
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND subject_id = v_subject_id
      AND status = 'active'
      AND subscription_type IN ('free', 'premium')
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_subscription;
  
  RETURN v_has_subscription;
END;
$$;

-- Recreate the RLS policy that was dropped
CREATE POLICY "Authenticated users with subscription can view published content"
ON public.content
FOR SELECT
TO authenticated
USING ((is_published = true) AND check_content_access(id));