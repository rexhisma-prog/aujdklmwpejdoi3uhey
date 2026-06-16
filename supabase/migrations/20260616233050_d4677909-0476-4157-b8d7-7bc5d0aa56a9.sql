CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT,
  topup_amount_eur NUMERIC NOT NULL,
  bonus_eur NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer or admin views earnings" ON public.referral_earnings
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage earnings" ON public.referral_earnings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);