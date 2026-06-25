
-- Tables
CREATE TABLE public.profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text, headline text, tagline text, bio text, email text, phone text,
  location text, avatar_url text, resume_url text, linkedin_url text, github_url text,
  career_goal text, updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, description text, image_url text, materials text,
  project_type text, category text, sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, category text, level text, sort_order integer DEFAULT 0
);
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, issuer text, issued_date date, type text DEFAULT 'general',
  image_url text, certificate_url text, sort_order integer DEFAULT 0
);
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL, location text, duration text, learnings text[],
  sort_order integer DEFAULT 0
);
CREATE TABLE public.drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text, description text, image_url text NOT NULL,
  category text DEFAULT 'Drawing', sort_order integer DEFAULT 0
);
CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, url text NOT NULL, icon text, sort_order integer DEFAULT 0
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  UNIQUE(user_id)
);
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL, message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT ON public.profile, public.projects, public.skills, public.certificates, public.internships, public.drawings, public.social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile, public.projects, public.skills, public.certificates, public.internships, public.drawings, public.social_links TO authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.profile, public.projects, public.skills, public.certificates, public.internships, public.drawings, public.social_links, public.contact_messages, public.user_roles TO service_role;

-- RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Admin check function (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

-- Public read policies
CREATE POLICY "Public read profile" ON public.profile FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public read internships" ON public.internships FOR SELECT USING (true);
CREATE POLICY "Public read drawings" ON public.drawings FOR SELECT USING (true);
CREATE POLICY "Public read social_links" ON public.social_links FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admin write profile" ON public.profile FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write projects" ON public.projects FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write skills" ON public.skills FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write certificates" ON public.certificates FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write internships" ON public.internships FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write drawings" ON public.drawings FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admin write social_links" ON public.social_links FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- New user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'ranjithkumar41690rk@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
