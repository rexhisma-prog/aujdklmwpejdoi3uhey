CREATE OR REPLACE FUNCTION public.validate_topup_minimum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.amount_eur <= 0 THEN
    RAISE EXCEPTION 'Shuma duhet të jetë më e madhe se 0 €.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_topup_minimum() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_topup_minimum() TO service_role;