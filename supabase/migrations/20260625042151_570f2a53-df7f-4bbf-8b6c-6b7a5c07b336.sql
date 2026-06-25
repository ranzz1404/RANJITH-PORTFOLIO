
-- 1. profile: restrict raw table SELECT to admin; expose safe columns via view
DROP POLICY IF EXISTS "Public read profile" ON public.profile;
CREATE POLICY "Admin reads profile" ON public.profile FOR SELECT USING (public.is_current_user_admin());

CREATE OR REPLACE VIEW public.public_profile
WITH (security_invoker = false) AS
SELECT id, full_name, headline, tagline, bio, location, avatar_url,
       resume_url, linkedin_url, github_url, career_goal, updated_at
FROM public.profile;

GRANT SELECT ON public.public_profile TO anon, authenticated;

-- 2. user_roles: admin-only write policies to prevent privilege escalation
CREATE POLICY "Admin inserts roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin updates roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin deletes roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

-- 3. SECURITY DEFINER functions: lock down EXECUTE
-- is_current_user_admin can safely run as INVOKER since user_roles RLS lets users read their own role
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

-- handle_new_user_role must stay DEFINER (trigger on auth.users); revoke from API roles
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- 4. contact_messages: tighten WITH CHECK away from bare true
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 200
    AND email LIKE '%_@_%.__%'
    AND length(btrim(message)) BETWEEN 1 AND 5000
  );
