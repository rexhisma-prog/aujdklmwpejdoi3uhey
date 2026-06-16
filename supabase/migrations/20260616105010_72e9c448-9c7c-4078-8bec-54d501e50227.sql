REVOKE EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) TO service_role;