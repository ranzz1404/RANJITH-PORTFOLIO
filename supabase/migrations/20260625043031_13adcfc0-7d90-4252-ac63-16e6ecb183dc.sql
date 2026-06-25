
-- Admin can fetch full profile row via SECURITY DEFINER fn (column grants restrict direct table access)
CREATE OR REPLACE FUNCTION public.get_admin_profile()
RETURNS SETOF public.profile
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.profile LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_profile() TO authenticated;

-- Allow authenticated users to call is_current_user_admin (already INVOKER, but ensure grant)
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
