
DROP VIEW IF EXISTS public.public_profile;
CREATE VIEW public.public_profile WITH (security_invoker = true) AS
SELECT id, full_name, headline, tagline, bio, location, avatar_url,
       resume_url, linkedin_url, github_url, career_goal, updated_at
FROM public.profile;
GRANT SELECT ON public.public_profile TO anon, authenticated;

DROP POLICY IF EXISTS "Admin reads profile" ON public.profile;
CREATE POLICY "Public read profile" ON public.profile FOR SELECT USING (true);

REVOKE SELECT ON public.profile FROM anon, authenticated;
GRANT SELECT (id, full_name, headline, tagline, bio, location, avatar_url,
              resume_url, linkedin_url, github_url, career_goal, updated_at)
  ON public.profile TO anon;
GRANT SELECT ON public.profile TO authenticated;
