-- Check current policies first
SELECT policyname, cmd::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Self access only - zero trust model" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile view access" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile insert access" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile update access" ON public.profiles;