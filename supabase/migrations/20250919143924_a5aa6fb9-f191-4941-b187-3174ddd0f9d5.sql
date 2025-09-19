-- Create admin tickets system for managing issues and support requests

-- Create tickets table for admin management
CREATE TABLE public.admin_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'account', 'content', 'security')),
  created_by uuid NOT NULL,
  assigned_to uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone NULL
);

-- Enable RLS on admin_tickets
ALTER TABLE public.admin_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for admin tickets
-- Only admins and teachers can view tickets
CREATE POLICY "Admins and teachers can view tickets" 
ON public.admin_tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- Users can create tickets, admins and teachers can insert
CREATE POLICY "Users can create tickets" 
ON public.admin_tickets 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- Only admins and teachers can update tickets
CREATE POLICY "Admins and teachers can update tickets" 
ON public.admin_tickets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_admin_tickets_updated_at
BEFORE UPDATE ON public.admin_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_admin_tickets_status ON public.admin_tickets(status);
CREATE INDEX idx_admin_tickets_created_by ON public.admin_tickets(created_by);
CREATE INDEX idx_admin_tickets_assigned_to ON public.admin_tickets(assigned_to);

-- Create function to get ticket statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_ticket_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tickets integer;
  open_tickets integer;
  resolved_tickets integer;
  high_priority_tickets integer;
BEGIN
  -- Only admins and teachers can call this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin or teacher access required';
  END IF;

  SELECT COUNT(*) INTO total_tickets FROM public.admin_tickets;
  SELECT COUNT(*) INTO open_tickets FROM public.admin_tickets WHERE status = 'open';
  SELECT COUNT(*) INTO resolved_tickets FROM public.admin_tickets WHERE status = 'resolved';
  SELECT COUNT(*) INTO high_priority_tickets FROM public.admin_tickets WHERE priority = 'high' AND status != 'resolved';

  RETURN jsonb_build_object(
    'total_tickets', total_tickets,
    'open_tickets', open_tickets,
    'resolved_tickets', resolved_tickets,
    'high_priority_tickets', high_priority_tickets
  );
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.admin_tickets IS 'Administrative ticket system for managing support requests and issues';
COMMENT ON FUNCTION public.get_admin_ticket_stats() IS 'Returns ticket statistics for admin dashboard';