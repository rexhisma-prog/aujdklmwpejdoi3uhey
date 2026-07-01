REVOKE EXECUTE ON FUNCTION public.credit_topup_by_session(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_topup_by_session(text, boolean) TO service_role;