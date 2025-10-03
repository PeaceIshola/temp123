-- Update check_content_access function to work with new subscriptions structure
CREATE OR REPLACE FUNCTION public.check_content_access(p_content_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subject_id uuid;
  v_has_subscription boolean;
  v_subscription jsonb;
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
  
  -- Check if user has an active subscription (free OR premium) for this subject in JSONB array
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s,
    jsonb_array_elements(s.subscriptions) AS sub
    WHERE s.user_id = auth.uid()
      AND (sub->>'subject_id')::uuid = v_subject_id
      AND sub->>'status' = 'active'
      AND sub->>'subscription_type' IN ('free', 'premium')
      AND (sub->>'expires_at' IS NULL OR (sub->>'expires_at')::timestamp > now())
  ) INTO v_has_subscription;
  
  RETURN v_has_subscription;
END;
$function$;