revoke select on public.referral_earnings from authenticated;

grant select (id, referrer_id, referred_user_id, topup_amount_eur, bonus_eur, status, created_at)
  on public.referral_earnings to authenticated;