-- Harden column-level grants so privacy/abuse-sensitive columns cannot be
-- written or read by ordinary authenticated users via the Data API.

-- 1) Prevent users from supplying 'referred_by' (and 'signup_ip') on profile insert.
--    Re-grant INSERT only on the columns a user is allowed to set themselves.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (user_id, email, balance_eur, referral_code) ON public.profiles TO authenticated;

-- 2) Hide referred users' IP addresses from referrers.
--    Re-grant SELECT on referrals excluding 'signup_ip'.
REVOKE SELECT ON public.referrals FROM authenticated;
GRANT SELECT (id, referrer_id, referred_user_id, referred_email, status, bonus_paid, created_at)
  ON public.referrals TO authenticated;

-- service_role keeps full access for admin/edge logic.
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.referrals TO service_role;