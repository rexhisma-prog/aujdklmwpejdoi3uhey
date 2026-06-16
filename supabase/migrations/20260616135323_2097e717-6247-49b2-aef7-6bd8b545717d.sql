-- Trigger-only functions: nothing should call these directly
REVOKE EXECUTE ON FUNCTION public.validate_order() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Service-role-only helpers: remove signed-in user access
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_topup_by_session(text, boolean) FROM authenticated;