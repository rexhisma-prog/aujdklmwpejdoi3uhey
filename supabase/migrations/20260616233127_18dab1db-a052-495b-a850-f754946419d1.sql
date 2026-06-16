CREATE OR REPLACE FUNCTION public.claim_referral(_code TEXT, _ip TEXT, _email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _referrer UUID;
BEGIN
  IF _uid IS NULL OR _code IS NULL THEN
    RETURN false;
  END IF;

  SELECT user_id INTO _referrer FROM public.profiles WHERE referral_code = lower(_code);
  IF _referrer IS NULL OR _referrer = _uid THEN
    RETURN false;
  END IF;

  INSERT INTO public.profiles (user_id, email)
  VALUES (_uid, _email)
  ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid AND referred_by IS NOT NULL) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET referred_by = _referrer, signup_ip = COALESCE(signup_ip, _ip)
  WHERE user_id = _uid;

  INSERT INTO public.referrals (referrer_id, referred_user_id, referred_email, signup_ip, status)
  VALUES (_referrer, _uid, _email, _ip, 'active')
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_referral(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(TEXT, TEXT, TEXT) TO authenticated;