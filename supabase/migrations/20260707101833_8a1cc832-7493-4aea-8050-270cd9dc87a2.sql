
-- 1) Convert is_current_user_admin() from SECURITY DEFINER to SECURITY INVOKER.
--    RLS on user_roles ("Read own role") already lets the caller see their own row,
--    which is sufficient for this check. Also revoke EXECUTE from PUBLIC and grant
--    only to authenticated to minimize the attack surface.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;

-- 2) Lock down public.profile so sensitive columns (phone, email) are no longer
--    readable by anon or any signed-in user. The public site already reads from
--    the public_profile view (which excludes sensitive fields), so restricting
--    the base table does not affect the portfolio UI.
DROP POLICY IF EXISTS "Public read profile" ON public.profile;

CREATE POLICY "Admin read profile"
ON public.profile
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

REVOKE SELECT ON public.profile FROM anon;
