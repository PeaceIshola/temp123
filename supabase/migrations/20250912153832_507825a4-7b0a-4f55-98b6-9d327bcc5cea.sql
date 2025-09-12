-- Check what content types are currently allowed
SELECT conname, consrc FROM pg_constraint 
WHERE conrelid = 'public.content'::regclass 
AND contype = 'c';