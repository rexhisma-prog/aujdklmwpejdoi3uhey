
REVOKE EXECUTE ON FUNCTION public.approve_topup(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_topup(UUID) TO authenticated;
