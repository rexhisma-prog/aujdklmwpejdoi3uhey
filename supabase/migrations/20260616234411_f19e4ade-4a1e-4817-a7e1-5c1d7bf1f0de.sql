CREATE OR REPLACE FUNCTION public.admin_list_referral_earnings()
RETURNS TABLE (
  id uuid,
  referred_email text,
  topup_amount_eur numeric,
  bonus_eur numeric,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT e.id, e.referred_email, e.topup_amount_eur, e.bonus_eur, e.status, e.created_at
  FROM public.referral_earnings e
  ORDER BY e.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_referral_earnings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_referral_earnings() TO authenticated;