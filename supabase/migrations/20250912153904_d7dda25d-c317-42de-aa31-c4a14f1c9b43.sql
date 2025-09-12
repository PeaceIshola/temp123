-- Check constraints on content table
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.content'::regclass 
AND contype = 'c';