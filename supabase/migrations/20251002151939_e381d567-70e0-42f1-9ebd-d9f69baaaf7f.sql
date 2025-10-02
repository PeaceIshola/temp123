-- ========================================
-- FIX: Set search_path on new functions
-- ========================================
-- Ensure all functions have immutable search_path for security

-- Fix hash_email function
CREATE OR REPLACE FUNCTION public.hash_email(email_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(lower(trim(email_address)), 'sha256'), 'hex');
END;
$$;