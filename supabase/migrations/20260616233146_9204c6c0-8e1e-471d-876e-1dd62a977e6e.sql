CREATE OR REPLACE FUNCTION public.approve_topup(_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req public.topup_requests;
  _referrer UUID;
  _referred_ip TEXT;
  _referrer_ip TEXT;
  _bonus NUMERIC;
  _already_paid BOOLEAN;
  _ref_email TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO _req FROM public.topup_requests WHERE id = _request_id FOR UPDATE;
  IF _req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF _req.status = 'approved' THEN
    RETURN;
  END IF;

  UPDATE public.topup_requests SET status = 'approved' WHERE id = _request_id;

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
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_topup(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_topup(UUID) TO authenticated;