CREATE OR REPLACE FUNCTION public.complete_topup_by_session(_session_id text, _paid boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- paid: do NOT credit balance automatically.
  -- Mark as paid and wait for admin confirmation.
  IF _req.status IN ('approved', 'paid') THEN
    RETURN true;
  END IF;

  UPDATE public.topup_requests SET status = 'paid' WHERE id = _req.id;

  RETURN true;
END;
$function$;