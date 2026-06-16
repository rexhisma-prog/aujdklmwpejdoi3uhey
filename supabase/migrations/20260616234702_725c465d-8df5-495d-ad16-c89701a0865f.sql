CREATE OR REPLACE FUNCTION public.validate_topup_minimum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referred_by uuid;
  _min numeric := 10;
BEGIN
  SELECT referred_by INTO _referred_by FROM public.profiles WHERE user_id = NEW.user_id;
  IF _referred_by IS NOT NULL THEN
    _min := 20;
  END IF;

  IF NEW.amount_eur < _min THEN
    RAISE EXCEPTION 'Shuma minimale për mbushje është % €.', _min;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_topup_minimum() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_validate_topup_minimum ON public.topup_requests;
CREATE TRIGGER trg_validate_topup_minimum
BEFORE INSERT ON public.topup_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_topup_minimum();