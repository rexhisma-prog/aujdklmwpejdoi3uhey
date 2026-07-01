CREATE OR REPLACE FUNCTION public.credit_topup_by_id(_topup_id uuid, _paid boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _req public.topup_requests;
  _referrer UUID;
  _referred_ip TEXT;
  _referrer_ip TEXT;
  _bonus NUMERIC;
  _already_paid BOOLEAN;
  _ref_email TEXT;
BEGIN
  SELECT * INTO _req FROM public.topup_requests
    WHERE id = _topup_id FOR UPDATE;
  IF _req IS NULL THEN
    RETURN false;
  END IF;

  IF NOT _paid THEN
    IF _req.status = 'pending' THEN
      UPDATE public.topup_requests SET status = 'failed' WHERE id = _req.id;
    END IF;
    RETURN true;
  END IF;

  IF _req.status IN ('approved', 'paid') THEN
    RETURN true;
  END IF;

  UPDATE public.topup_requests SET status = 'approved' WHERE id = _req.id;

  INSERT INTO public.profiles (user_id, balance_eur)
  VALUES (_req.user_id, _req.amount_eur)
  ON CONFLICT (user_id) DO UPDATE
  SET balance_eur = public.profiles.balance_eur + _req.amount_eur;

  SELECT referred_by, signup_ip, email INTO _referrer, _referred_ip, _ref_email
  FROM public.profiles WHERE user_id = _req.user_id;

  IF _referrer IS NOT NULL THEN
    SELECT bonus_paid INTO _already_paid FROM public.referrals WHERE referred_user_id = _req.user_id;

    IF COALESCE(_already_paid, false) = false THEN
      SELECT signup_ip INTO _referrer_ip FROM public.profiles WHERE user_id = _referrer;

      IF _referred_ip IS NULL OR _referrer_ip IS NULL OR _referred_ip <> _referrer_ip THEN
        _bonus := round(_req.amount_eur * 0.15, 2);

        UPDATE public.profiles
        SET balance_eur = balance_eur + _bonus,
            referral_earnings_eur = referral_earnings_eur + _bonus
        WHERE user_id = _referrer;

        INSERT INTO public.referral_earnings
          (referrer_id, referred_user_id, referred_email, topup_amount_eur, bonus_eur, status)
        VALUES (_referrer, _req.user_id, _ref_email, _req.amount_eur, _bonus, 'paid');

        UPDATE public.referrals SET bonus_paid = true, status = 'active'
        WHERE referred_user_id = _req.user_id;
      END IF;
    END IF;
  END IF;

  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.credit_topup_by_id(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_topup_by_id(uuid, boolean) TO service_role;