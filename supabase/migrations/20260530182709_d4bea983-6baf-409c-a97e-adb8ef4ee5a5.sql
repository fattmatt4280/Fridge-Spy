-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where required.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;

-- has_role and has_active_subscription are referenced by RLS policies, so authenticated users
-- must retain EXECUTE for policy evaluation.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;

-- Trigger and admin-only functions remain executable by the table/function owner and service_role.
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(uuid, integer) TO service_role;