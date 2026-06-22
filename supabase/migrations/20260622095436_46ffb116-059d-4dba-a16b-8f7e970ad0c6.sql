-- referrals: restrict authenticated SELECT to non-sensitive columns (exclude signup_ip)
REVOKE SELECT ON public.referrals FROM authenticated;
GRANT SELECT (id, referrer_id, referred_user_id, referred_email, status, bonus_paid, created_at) ON public.referrals TO authenticated;

-- referral_earnings: restrict authenticated SELECT to non-sensitive columns (exclude referred_email)
REVOKE SELECT ON public.referral_earnings FROM authenticated;
GRANT SELECT (id, referrer_id, referred_user_id, topup_amount_eur, bonus_eur, status, created_at) ON public.referral_earnings TO authenticated;