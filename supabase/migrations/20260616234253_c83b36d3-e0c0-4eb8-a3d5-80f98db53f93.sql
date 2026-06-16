-- 1. Hide referred_email from referrers on referral_earnings
REVOKE SELECT ON public.referral_earnings FROM authenticated;
GRANT SELECT (id, created_at, referrer_id, referred_user_id, topup_amount_eur, bonus_eur, status) ON public.referral_earnings TO authenticated;

-- 2. Hide referred_email (and signup_ip) from referrers on referrals
REVOKE SELECT ON public.referrals FROM authenticated;
GRANT SELECT (id, created_at, referrer_id, referred_user_id, bonus_paid, status) ON public.referrals TO authenticated;

-- 3. Prevent clients from setting signup_ip on profile insert
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (user_id, email, balance_eur, referral_code, referred_by, referral_earnings_eur, created_at, updated_at) ON public.profiles TO authenticated;

-- 4. Prevent clients from setting email on topup_requests; populate it server-side from the profile
REVOKE INSERT ON public.topup_requests FROM authenticated;
GRANT INSERT (user_id, amount_eur, status, method, provider_session_id, reference, created_at, updated_at) ON public.topup_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.set_topup_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT email INTO NEW.email FROM public.profiles WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_topup_email ON public.topup_requests;
CREATE TRIGGER trg_set_topup_email
BEFORE INSERT ON public.topup_requests
FOR EACH ROW EXECUTE FUNCTION public.set_topup_email();