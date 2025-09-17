-- Check current RLS policies on profiles table
SELECT 
  policyname, 
  permissive, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Also verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';