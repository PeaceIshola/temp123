-- ========================================
-- FIX: Secure Content Access with Authentication and Subscription Verification
-- ========================================

-- Step 1: Drop the insecure public access policy
DROP POLICY IF EXISTS "Everyone can view published content" ON public.content;

-- Step 2: Create a security definer function to check content access
CREATE OR REPLACE FUNCTION public.check_content_access(p_content_id uuid)
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
  
  -- Check if user has an active subscription for this subject
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND subject_id = v_subject_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_subscription;
  
  RETURN v_has_subscription;
END;
$$;

-- Step 3: Create new secure policies for content access
-- Policy for authenticated users with valid subscriptions
CREATE POLICY "Authenticated users with subscription can view published content"
ON public.content
FOR SELECT
TO authenticated
USING (
  is_published = true 
  AND public.check_content_access(id)
);

-- Policy for teachers/admins to view all content (already exists but ensure it's active)
-- The existing "Teachers can view all content" policy already covers this

-- Add helpful comment
COMMENT ON FUNCTION public.check_content_access(uuid) IS
'Verifies user has active subscription for the subject containing the content. Teachers/admins always have access.';

COMMENT ON POLICY "Authenticated users with subscription can view published content" ON public.content IS
'Requires authentication AND active subscription for the content subject. Prevents unauthorized access to premium materials.';