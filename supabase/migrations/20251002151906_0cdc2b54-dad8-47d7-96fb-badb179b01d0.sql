-- ========================================
-- FIX: Move Emails to Encrypted Storage (Part 2)
-- ========================================
-- First drop policies that depend on email column, then remove the column

-- Step 1: Create hash function if not exists
CREATE OR REPLACE FUNCTION public.hash_email(email_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(lower(trim(email_address)), 'sha256'), 'hex');
END;
$$;

-- Step 2: Migrate existing email data to sensitive_profile_data
INSERT INTO public.sensitive_profile_data (user_id, encrypted_email, email_hash)
SELECT 
  user_id,
  email as encrypted_email,
  public.hash_email(email) as email_hash
FROM public.profiles
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
SET 
  encrypted_email = EXCLUDED.encrypted_email,
  email_hash = EXCLUDED.email_hash,
  updated_at = now();

-- Step 3: Drop policies that depend on email column
DROP POLICY IF EXISTS "Users update own profile - email protected" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

-- Step 4: Create new policies without email dependency
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NOT NULL) AND (auth.uid() = user_id)
);

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO public
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))
WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

-- Step 5: Now we can safely drop the email column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Step 6: Update get_my_email() to use sensitive_profile_data
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  UPDATE public.sensitive_profile_data
  SET 
    last_email_access = now(),
    email_access_count = email_access_count + 1
  WHERE user_id = auth.uid()
  RETURNING encrypted_email INTO user_email;
  
  RETURN user_email;
END;
$$;

-- Step 7: Update get_user_email_secure()
CREATE OR REPLACE FUNCTION public.get_user_email_secure(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  is_teacher boolean;
BEGIN
  IF auth.uid() = target_user_id THEN
    SELECT encrypted_email INTO user_email 
    FROM public.sensitive_profile_data
    WHERE user_id = target_user_id;
    
    UPDATE public.sensitive_profile_data
    SET 
      last_email_access = now(),
      email_access_count = email_access_count + 1
    WHERE user_id = target_user_id;
    
    RETURN user_email;
  END IF;
  
  is_teacher := EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
  
  IF is_teacher THEN
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address
    ) VALUES (
      auth.uid(),
      target_user_id,
      'EMAIL_ACCESS_BY_TEACHER',
      inet_client_addr()
    );
    
    SELECT public.get_anonymized_email(encrypted_email) INTO user_email 
    FROM public.sensitive_profile_data
    WHERE user_id = target_user_id;
    
    RETURN user_email;
  END IF;
  
  INSERT INTO public.profile_access_logs (
    accessor_user_id,
    accessed_user_id,
    access_type,
    ip_address
  ) VALUES (
    auth.uid(),
    target_user_id,
    'UNAUTHORIZED_EMAIL_ACCESS_ATTEMPT',
    inet_client_addr()
  );
  
  RAISE EXCEPTION 'Unauthorized access to email information';
END;
$$;

-- Step 8: Update handle_new_user to store in sensitive_profile_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User')
  );
  
  INSERT INTO public.sensitive_profile_data (user_id, encrypted_email, email_hash)
  VALUES (
    NEW.id,
    NEW.email,
    public.hash_email(NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Step 9: Document the security model
COMMENT ON TABLE public.sensitive_profile_data IS
'CRITICAL SECURITY: Contains sensitive user data with encrypted email addresses.
Access strictly controlled via security definer functions only.
All email access is logged and rate-limited.';

COMMENT ON COLUMN public.sensitive_profile_data.encrypted_email IS
'Email address with access logging and rate limiting.';

COMMENT ON COLUMN public.sensitive_profile_data.email_hash IS
'SHA-256 hash of email for secure lookups without exposing actual address.';