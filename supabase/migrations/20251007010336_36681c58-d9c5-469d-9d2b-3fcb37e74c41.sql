-- Create function to sync user name from profiles to subscriptions
CREATE OR REPLACE FUNCTION public.sync_subscription_user_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user_name in subscriptions table when profile is updated
  UPDATE public.subscriptions
  SET 
    user_name = NEW.full_name,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync user name on profile update
DROP TRIGGER IF EXISTS sync_subscription_name_on_profile_update ON public.profiles;

CREATE TRIGGER sync_subscription_name_on_profile_update
  AFTER UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION public.sync_subscription_user_name();

-- Sync existing profiles to subscriptions (one-time update)
UPDATE public.subscriptions s
SET user_name = p.full_name
FROM public.profiles p
WHERE s.user_id = p.user_id
  AND (s.user_name IS NULL OR s.user_name != p.full_name);