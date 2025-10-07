-- Add INSERT policy for sensitive_profile_data to allow user registration
-- Without this policy, the handle_new_user() trigger will fail during signup

CREATE POLICY "Users can insert own sensitive data"
ON public.sensitive_profile_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);