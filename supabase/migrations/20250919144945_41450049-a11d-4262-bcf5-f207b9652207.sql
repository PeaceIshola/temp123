-- Fix the audit trigger to handle admin updates from Supabase dashboard
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if there's an authenticated user (skip admin dashboard updates)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.profile_access_logs (
      accessor_user_id,
      accessed_user_id,
      access_type,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.user_id, OLD.user_id),
      TG_OP,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
  
  -- For UPDATE operations, ensure sensitive fields aren't changed inappropriately
  IF TG_OP = 'UPDATE' THEN
    -- Allow admin updates from dashboard (when auth.uid() is null)
    IF OLD.email IS DISTINCT FROM NEW.email AND auth.uid() IS NOT NULL AND auth.uid() != OLD.user_id THEN
      RAISE EXCEPTION 'Unauthorized email modification attempt detected';
    END IF;
    
    -- Sanitize and validate input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Allow admin inserts from dashboard (when auth.uid() is null)
    IF NEW.user_id != auth.uid() AND auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Users can only create their own profiles';
    END IF;
    
    -- Sanitize input data
    NEW.full_name := TRIM(BOTH FROM COALESCE(NEW.full_name, ''));
    NEW.first_name := TRIM(BOTH FROM COALESCE(NEW.first_name, ''));
    NEW.last_name := TRIM(BOTH FROM COALESCE(NEW.last_name, ''));
    NEW.username := TRIM(BOTH FROM COALESCE(NEW.username, ''));
    NEW.school_name := TRIM(BOTH FROM COALESCE(NEW.school_name, ''));
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format provided';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;