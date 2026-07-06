-- Revoke public execute on money-crediting SECURITY DEFINER functions.
-- These are only ever invoked by webhook handlers via the service-role client,
-- which bypasses GRANTs, so removing public access does not break payments.

REVOKE EXECUTE ON FUNCTION public.credit_topup_by_session(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_topup_by_id(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.credit_topup_by_session(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_topup_by_id(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) TO service_role;
