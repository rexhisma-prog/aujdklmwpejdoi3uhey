
ALTER TABLE public.topup_requests ADD COLUMN IF NOT EXISTS provider_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_topup_provider_session ON public.topup_requests(provider_session_id);

CREATE OR REPLACE FUNCTION public.complete_topup_by_session(_session_id TEXT, _paid BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req public.topup_requests;
BEGIN
  SELECT * INTO _req FROM public.topup_requests
    WHERE provider_session_id = _session_id FOR UPDATE;
  IF _req IS NULL THEN
    RETURN false;
  END IF;

  IF NOT _paid THEN
    IF _req.status = 'pending' THEN
      UPDATE public.topup_requests SET status = 'failed' WHERE id = _req.id;
    END IF;
    RETURN true;
  END IF;

  -- paid: credit only once
  IF _req.status = 'approved' THEN
    RETURN true;
  END IF;

  UPDATE public.topup_requests SET status = 'approved' WHERE id = _req.id;

  INSERT INTO public.profiles (user_id, balance_eur)
  VALUES (_req.user_id, _req.amount_eur)
  ON CONFLICT (user_id) DO UPDATE
  SET balance_eur = public.profiles.balance_eur + _req.amount_eur;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_topup_by_session(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_topup_by_session(TEXT, BOOLEAN) TO service_role;
