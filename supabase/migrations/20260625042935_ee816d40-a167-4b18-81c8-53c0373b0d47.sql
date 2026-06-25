
REVOKE SELECT ON public.profile FROM authenticated;
GRANT SELECT (id, full_name, headline, tagline, bio, location, avatar_url,
              resume_url, linkedin_url, github_url, career_goal, updated_at)
  ON public.profile TO authenticated;
-- Admin reads full row via service_role (admin app uses authenticated session for writes only)
GRANT SELECT ON public.profile TO service_role;
-- Add admin SELECT policy alongside public so admins (authenticated) can still read all columns through RLS
-- (column grants restrict authenticated, so admin UI will use public_profile view or explicit columns)
