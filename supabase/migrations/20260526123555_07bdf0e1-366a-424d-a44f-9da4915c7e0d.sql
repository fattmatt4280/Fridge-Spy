REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(uuid, integer) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(uuid, integer) TO service_role;