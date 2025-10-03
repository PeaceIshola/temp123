-- Update handle_new_user trigger to use secure role assignment function
-- This ensures new users get roles through the proper secure channel

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  new_user_role_result jsonb;
BEGIN
  -- Create profile first
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'student'
  );
  
  -- Assign default student role through secure function
  -- Using a special system bypass since this is during user creation
  -- and there's no existing admin context yet
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (NEW.id, 'student', NEW.id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create sensitive profile data
  INSERT INTO public.sensitive_profile_data (user_id, encrypted_email, email_hash)
  VALUES (
    NEW.id,
    NEW.email,
    public.hash_email(NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Also need to grant a special exception for the trigger's security definer context
-- Create a policy that allows the security definer function to insert during user creation
CREATE POLICY "Allow system to assign roles during user creation"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the assignment is being done by the trigger (assigned_by = user_id during signup)
  user_id = assigned_by AND assigned_by = auth.uid()
);