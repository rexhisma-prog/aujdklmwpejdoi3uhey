-- Prevent clients from setting referred_by directly on profiles.
-- referred_by must only be set by the claim_referral SECURITY DEFINER function.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (user_id, email, balance_eur, referral_code, referral_earnings_eur, created_at, updated_at) ON public.profiles TO authenticated;