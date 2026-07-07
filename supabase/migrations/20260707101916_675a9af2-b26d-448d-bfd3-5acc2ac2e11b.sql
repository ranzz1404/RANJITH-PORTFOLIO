-- get_admin_profile was a SECURITY DEFINER wrapper that let admins read the
-- profile table. Now that "Admin read profile" RLS policy allows the admin to
-- SELECT directly from public.profile, this elevated-privilege wrapper is
-- unnecessary and only widens the attack surface.
DROP FUNCTION IF EXISTS public.get_admin_profile();