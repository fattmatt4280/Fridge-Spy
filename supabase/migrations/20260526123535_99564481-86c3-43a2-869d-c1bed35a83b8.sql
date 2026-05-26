CREATE OR REPLACE FUNCTION public.increment_scan_usage(p_row_id uuid, p_max integer)
RETURNS TABLE(new_used integer, accepted boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used integer;
BEGIN
  UPDATE public.scan_usage
  SET used = used + 1, updated_at = now()
  WHERE id = p_row_id AND used < p_max
  RETURNING used INTO v_used;

  IF v_used IS NULL THEN
    SELECT used INTO v_used FROM public.scan_usage WHERE id = p_row_id;
    RETURN QUERY SELECT COALESCE(v_used, 0), false;
  ELSE
    RETURN QUERY SELECT v_used, true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_scan_usage(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(uuid, integer) TO service_role;