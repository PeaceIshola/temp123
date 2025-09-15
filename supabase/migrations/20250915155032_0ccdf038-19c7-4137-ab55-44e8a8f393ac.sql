-- Enable real-time updates for homework_help_questions table
ALTER TABLE public.homework_help_questions REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.homework_help_questions;