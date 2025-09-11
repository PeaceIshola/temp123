-- Update the first user to have admin role for testing
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = 'c57364a2-ea97-4f3e-a23c-d0358bcb3721';