-- 1. Order price tampering + target_link protocol validation via BEFORE INSERT trigger
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_before_insert ON public.orders;
CREATE TRIGGER validate_order_before_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order();

-- 2. Remove hardcoded admin emails from the new-user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Set fixed search_path on email queue helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path TO 'public', 'pgmq';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path TO 'public', 'pgmq';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path TO 'public', 'pgmq';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO 'public', 'pgmq';

-- 4. Restrict execution of sensitive SECURITY DEFINER functions from anon/public
REVOKE EXECUTE ON FUNCTION public.approve_topup(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.approve_topup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;