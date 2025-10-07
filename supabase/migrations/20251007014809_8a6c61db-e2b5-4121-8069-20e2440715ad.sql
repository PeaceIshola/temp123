-- SECURITY FIX: Remove teacher access to subscription payment data
-- Teachers get full access through their role, they don't need to see student subscriptions
-- This prevents teachers from viewing sensitive payment/subscription information

DROP POLICY IF EXISTS "Teachers can view all subscriptions" ON public.subscriptions;