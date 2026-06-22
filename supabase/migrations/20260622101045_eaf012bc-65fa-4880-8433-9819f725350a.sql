CREATE OR REPLACE FUNCTION public.validate_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _price numeric;
  _balance numeric;
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

  IF TG_OP = 'INSERT' THEN
    -- Force new orders to start as pending; clients cannot set arbitrary statuses.
    NEW.status := 'pending';

    -- Require sufficient paid balance, then deduct it atomically.
    SELECT balance_eur INTO _balance
    FROM public.profiles
    WHERE user_id = NEW.user_id
    FOR UPDATE;

    IF _balance IS NULL OR _balance < NEW.total_price_eur THEN
      RAISE EXCEPTION 'Balancë e pamjaftueshme. Mbushni balancin për të vazhduar.';
    END IF;

    UPDATE public.profiles
    SET balance_eur = balance_eur - NEW.total_price_eur
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;