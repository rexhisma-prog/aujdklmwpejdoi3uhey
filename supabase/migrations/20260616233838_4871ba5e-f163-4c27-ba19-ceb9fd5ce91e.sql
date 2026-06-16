-- 1. Orders: force status to 'pending' on insert and keep server-side price validation
CREATE OR REPLACE FUNCTION public.validate_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _price numeric;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.target_link IS NULL OR NEW.target_link !~* '^https?://' THEN
    RAISE EXCEPTION 'Invalid target link';
  END IF;

  SELECT price_eur INTO _price FROM public.services WHERE id = NEW.service_id;
  IF _price IS NULL THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  -- Always recompute price server-side, ignoring whatever the client sent.
  NEW.total_price_eur := round((_price * NEW.quantity) / 1000.0, 2);

  -- Force new orders to start as pending; clients cannot set arbitrary statuses.
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$function$;

-- Tighten INSERT policy to also require pending status (defense in depth)
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2. profiles: hide signup_ip from client reads via column-level privileges
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (user_id, referral_earnings_eur, referred_by, referral_code, updated_at, created_at, balance_eur, email) ON public.profiles TO authenticated;

-- 3. referrals: hide signup_ip from referrer reads via column-level privileges
REVOKE SELECT ON public.referrals FROM authenticated;
GRANT SELECT (referred_user_id, referrer_id, id, created_at, bonus_paid, status, referred_email) ON public.referrals TO authenticated;