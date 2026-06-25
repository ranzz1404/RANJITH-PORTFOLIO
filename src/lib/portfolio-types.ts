export type Profile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  tagline: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  career_goal: string | null;
};
export type Project = {
  id: string; title: string; description: string | null;
  image_url: string | null; materials: string | null;
  project_type: string | null; category: string | null; sort_order: number;
};
export type Skill = { id: string; name: string; category: string | null; level: string | null; sort_order: number };
export type Certificate = {
  id: string; title: string; issuer: string | null; issued_date: string | null;
  type: string | null; image_url: string | null; certificate_url: string | null; sort_order: number;
};
export type Internship = {
  id: string; company: string; location: string | null; duration: string | null;
  learnings: string[] | null; sort_order: number;
};
export type Drawing = {
  id: string; title: string | null; description: string | null;
  image_url: string; category: string | null; sort_order: number;
};
export type SocialLink = { id: string; label: string; url: string; icon: string | null; sort_order: number };
