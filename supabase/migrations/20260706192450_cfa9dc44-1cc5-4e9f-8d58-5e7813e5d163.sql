-- 1) Backend/service-only functions: no client access at all.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.generate_referral_code()',
    'public.handle_new_user_role()',
    'public.update_updated_at_column()',
    'public.set_referral_code()',
    'public.set_topup_email()',
    'public.validate_topup_minimum()',
    'public.validate_order()',
    'public.email_queue_wake()',
    'public.email_queue_dispatch()',
    'public.enqueue_email(text, jsonb)',
    'public.delete_email(text, bigint)',
    'public.read_email_batch(text, integer, integer)',
    'public.move_to_dlq(text, text, bigint, jsonb)'
  ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', fn);
  END LOOP;
END $$;

-- 2) Client-callable functions (signed-in only): remove anon, keep authenticated + service_role.
REVOKE EXECUTE ON FUNCTION public.approve_topup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_topup(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_list_referral_earnings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_referral_earnings() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.claim_referral(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text, text, text) TO authenticated, service_role;

-- 3) has_role: referenced by RLS policies, so it must stay executable by the
-- roles those policies run as (anon + authenticated). This is safe: it only
-- reads role membership and returns a boolean.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;
