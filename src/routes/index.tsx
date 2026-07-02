import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Linkedin, Mail, MapPin, Download, ArrowRight, ExternalLink, FileText, Wrench, GraduationCap, Award, Image as ImageIcon, Send } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/portfolio/Navbar";
import { Section } from "@/components/portfolio/Section";
import type { Profile, Project, Skill, Certificate, Internship, Drawing } from "@/lib/portfolio-types";

export const Route = createFileRoute("/")({
  component: PortfolioPage,
});

const sb = supabase as any;

function usePortfolio() {
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await sb.from("public_profile").select("*").limit(1).maybeSingle();
      return data as Profile | null;
    },
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await sb.from("projects").select("*").order("sort_order");
      return (data ?? []) as Project[];
    },
  });
  const skills = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data } = await sb.from("skills").select("*").order("sort_order");
      return (data ?? []) as Skill[];
    },
  });
  const certificates = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data } = await sb.from("certificates").select("*").order("sort_order");
      return (data ?? []) as Certificate[];
    },
  });
  const internships = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const { data } = await sb.from("internships").select("*").order("sort_order");
      return (data ?? []) as Internship[];
    },
  });
  const drawings = useQuery({
    queryKey: ["drawings"],
    queryFn: async () => {
      const { data } = await sb.from("drawings").select("*").order("sort_order");
      return (data ?? []) as Drawing[];
    },
  });
  return { profile, projects, skills, certificates, internships, drawings };
}

function PortfolioPage() {
  const { profile, projects, skills, certificates, internships, drawings } = usePortfolio();
  const p = profile.data;

  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen text-foreground relative z-10">
      {!introDone && <div className="intro-overlay" />}
      <Navbar />
      <Hero profile={p} />
      <About profile={p} />
      <SkillsSection items={skills.data ?? []} />
      <ProjectsSection items={projects.data ?? []} />
      <DrawingsSection items={drawings.data ?? []} />
      <InternshipsSection items={internships.data ?? []} />
      <CertificatesSection items={certificates.data ?? []} />
      <ContactSection profile={p} />
      <footer className="border-t border-border py-8 px-6 text-center hud-label">
        © {new Date().getFullYear()} Ranjith Kumar K · Engineered Portfolio
      </footer>
    </div>
  );
}

function Hero({ profile }: { profile: Profile | null | undefined }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 blueprint-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background pointer-events-none" />
      <svg className="absolute top-20 right-10 w-40 h-40 text-accent/10 hidden md:block z-[1]" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 15a35 35 0 100 70 35 35 0 000-70zm0 8l5 8h-10l5-8zm24.7 19.3l-8 5v-10l8 5zM77 50l-8 5v-10l8 5zm-2.3 14.7l-5-8h10l-5 8zM50 77l-5-8h10l-5 8zm-24.7-2.3l8-5v10l-8-5zM23 50l8-5v10l-8-5zm2.3-14.7l5 8h-10l5-8zM50 35a15 15 0 100 30 15 15 0 000-30z" />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center px-4 max-w-4xl"
      >
        <p className="hud-label text-accent mb-4">// PORTFOLIO_v01 — MECHANICAL ENGINEERING</p>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none">
          {profile?.full_name ?? "RANJITH KUMAR K"}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          {profile?.headline ?? "Mechanical Engineering Student"} <span className="text-accent">|</span> {profile?.tagline ?? "Aspiring Design Engineer"}
        </motion.p>
        <p className="mt-3 hud-label flex items-center justify-center gap-2">
          <MapPin className="w-3 h-3" /> {profile?.location ?? "Theni, Tamil Nadu, India"}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-mono text-sm uppercase tracking-wider hover:bg-accent/90 transition"
          >
            View Projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
          {profile?.resume_url ? (
            <a
              href={profile.resume_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-border hover:border-accent hover:text-accent px-6 py-3 font-mono text-sm uppercase tracking-wider transition"
            >
              <Download className="w-4 h-4" /> Download Resume
            </a>
          ) : (
            <button
              onClick={() => toast.info("Resume coming soon")}
              className="inline-flex items-center gap-2 border border-border hover:border-accent hover:text-accent px-6 py-3 font-mono text-sm uppercase tracking-wider transition"
            >
              <Download className="w-4 h-4" /> Download Resume
            </button>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

function About({ profile }: { profile: Profile | null | undefined }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const o = Math.max(-20, Math.min(20, -center / 25));
        setOffset(o);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Section
      id="about"
      label="// 01 — ABOUT"
      title="About Me"
      variant={{
        hidden: { opacity: 0, x: 60 },
        show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      <div ref={sectionRef} className="grid md:grid-cols-3 gap-8">
        <div
          className="md:col-span-2 space-y-6"
          style={{ transform: `translate3d(0, ${offset}px, 0)`, willChange: "transform" }}
        >
          <p className="text-lg leading-relaxed text-muted-foreground">
            {profile?.bio ?? "I am a passionate Mechanical Engineering student with a strong interest in design and manufacturing. I am constantly working to improve my technical skills and gain hands-on experience in the engineering field."}
          </p>
          {profile?.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-accent text-accent px-5 py-2 font-mono text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition"
            >
              <Linkedin className="w-4 h-4" /> Connect on LinkedIn
            </a>
          )}
        </div>
        <div
          className="border border-border bg-panel p-6 space-y-4"
          style={{ transform: `translate3d(0, ${-offset}px, 0)`, willChange: "transform" }}
        >
          <DataRow label="Name" value={profile?.full_name ?? "Ranjith Kumar K"} />
          <DataRow label="Degree" value="B.E. Mechanical Engineering" />
          <DataRow label="Year" value="2nd Year" />
          <DataRow label="College" value="Nadar Saraswathi College of Engineering and Technology, Theni" />
          <DataRow label="Career Goal" value={profile?.career_goal ?? "Design Engineer"} />
        </div>
      </div>
    </Section>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="hud-label">{label}</p>
      <p className="text-sm mt-1">{value}</p>
    </div>
  );
}

function SkillsSection({ items }: { items: Skill[] }) {
  return (
    <Section id="skills" label="// 02 — CAPABILITIES" title="Skills">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flip-card h-52"
          >
            <div className="flip-inner">
              <div className="flip-face border border-border bg-panel p-5 hover:border-accent transition">
                <div className="flex items-start justify-between">
                  <Wrench className="w-5 h-5 text-accent" />
                  <span className="hud-label">{s.category}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.name}</h3>
                <p className="mt-2 inline-block text-xs font-mono uppercase tracking-wider border border-accent/40 text-accent px-2 py-1">
                  {s.level}
                </p>
              </div>
              <div className="flip-face flip-back border border-accent bg-panel p-5 flex flex-col items-center justify-center text-center">
                <Wrench className="w-12 h-12 text-accent" />
                <p className="mt-3 hud-label">{s.category}</p>
                <p className="mt-2 text-2xl font-bold text-accent">{s.level}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    el.style.transition = "transform 0.1s ease-out, box-shadow 0.3s ease-out";
  };
  const onLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
    el.style.transition = "transform 0.4s ease-out, box-shadow 0.4s ease-out";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="tilt-card">
      {children}
    </div>
  );
}

function ProjectsSection({ items }: { items: Project[] }) {
  return (
    <Section id="projects" label="// 03 — BUILDS" title="Projects">
      <div className="grid md:grid-cols-2 gap-6">
        {items.length === 0 && <p className="text-muted-foreground">Projects coming soon.</p>}
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <TiltCard>
              <article className="border border-border bg-panel overflow-hidden hover:border-accent transition">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="h-48 blueprint-grid bg-muted flex items-center justify-center">
                    <FileText className="w-12 h-12 text-accent/30" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.project_type && (
                      <span className="text-[10px] font-mono uppercase tracking-wider border border-accent/40 text-accent px-2 py-1">
                        {p.project_type}
                      </span>
                    )}
                    {p.category && (
                      <span className="text-[10px] font-mono uppercase tracking-wider border border-border px-2 py-1">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold">{p.title}</h3>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{p.description}</p>
                  {p.materials && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="hud-label">Materials</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.materials}</p>
                    </div>
                  )}
                </div>
              </article>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function DrawingsSection({ items }: { items: Drawing[] }) {
  const [lightbox, setLightbox] = useState<Drawing | null>(null);
  return (
    <>
      <Section id="drawings" label="// 04 — GALLERY" title="Engineering Drawings & Gallery">
        {items.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <ImageIcon className="w-12 h-12 text-accent/40 mx-auto" />
            <p className="mt-4 text-muted-foreground">Drawings will be added soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => setLightbox(d)}
                className="group relative overflow-hidden border border-border aspect-square"
              >
                <img src={d.image_url} alt={d.title ?? "Drawing"} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4 transition">
                  <p className="hud-label text-accent">{d.category}</p>
                  <p className="text-sm font-bold">{d.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </Section>
      {lightbox && (
        <div className="lightbox-overlay fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4" style={{ perspective: 1200 }} onClick={() => setLightbox(null)}>
          <img src={lightbox.image_url} alt={lightbox.title ?? ""} className="lightbox-img max-h-[90vh] max-w-[90vw] object-contain border border-border" />
        </div>
      )}
    </>
  );
}

function InternshipsSection({ items }: { items: Internship[] }) {
  return (
    <Section id="internships" label="// 05 — FIELD WORK" title="Internships">
      <div className="relative space-y-8" style={{ perspective: 1000 }}>
        <svg className="absolute left-4 top-2 bottom-2 w-px h-full hidden sm:block overflow-visible" aria-hidden>
          <line x1="0" y1="0" x2="0" y2="100%" stroke="#FF6A00" strokeWidth="2"
            strokeDasharray="2000" strokeDashoffset="2000" className="draw-line" />
        </svg>
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, z: -50, y: 20 }}
            whileInView={{ opacity: 1, z: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative sm:pl-12"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute left-2 top-4 w-4 h-4 border-2 border-accent bg-background hidden sm:block" />
            <div className="border border-border bg-panel p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-bold">{it.company}</h3>
                <span className="hud-label text-accent">{it.duration}</span>
              </div>
              <p className="hud-label mt-1">{it.location}</p>
              {it.learnings && it.learnings.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {it.learnings.map((l, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-accent mt-1">▸</span> {l}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function CertificatesSection({ items }: { items: Certificate[] }) {
  return (
    <Section id="certificates" label="// 06 — CREDENTIALS" title="Certificates">
      {items.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <Award className="w-12 h-12 text-accent/40 mx-auto" />
          <p className="mt-4 text-muted-foreground">No certificates added yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ perspective: 1000 }}>
          {items.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
              className="cert-card border border-border bg-panel p-5 hover:border-accent flex flex-col"
            >
              <div className="flex items-center justify-between">
                <GraduationCap className="w-5 h-5 text-accent" />
                <span className="hud-label">{c.type}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.issuer}</p>
              {c.issued_date && <p className="hud-label mt-2">{c.issued_date}</p>}
              {c.certificate_url && (
                <a
                  href={c.certificate_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent hover:underline"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Particles() {
  const dots = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const size = 2 + Math.random() * 4;
      const orange = Math.random() > 0.5;
      return {
        i,
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: orange ? "#FF6A00" : "#888888",
        opacity: 0.3 + Math.random() * 0.2,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 4,
      };
    });
  }, []);
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <span
          key={d.i}
          className="particle"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: d.color,
            opacity: d.opacity,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function ContactSection({ profile }: { profile: Profile | null | undefined }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const { error } = await sb.from("contact_messages").insert(form);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    toast.success("Message sent! I'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="relative">
      <Particles />
      <div className="relative z-10">
        <Section id="contact" label="// 07 — TRANSMIT" title="Contact Me">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <a
                href={`mailto:${profile?.email ?? "ranjithkumar41690rk@gmail.com"}`}
                className="flex items-center gap-3 border border-border p-4 hover:border-accent transition"
              >
                <Mail className="w-5 h-5 text-accent" />
                <div>
                  <p className="hud-label">Email</p>
                  <p className="text-sm">{profile?.email ?? "ranjithkumar41690rk@gmail.com"}</p>
                </div>
              </a>
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 border border-border p-4 hover:border-accent transition">
                  <Linkedin className="w-5 h-5 text-accent" />
                  <div>
                    <p className="hud-label">LinkedIn</p>
                    <p className="text-sm">Ranjith Kumar</p>
                  </div>
                </a>
              )}
              <div className="flex items-center gap-3 border border-border p-4">
                <MapPin className="w-5 h-5 text-accent" />
                <div>
                  <p className="hud-label">Location</p>
                  <p className="text-sm">{profile?.location ?? "Theni, Tamil Nadu, India"}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-panel p-6">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div>
                <label className="hud-label block mb-2">Message</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2 text-sm font-sans transition"
                  maxLength={2000}
                />
              </div>
              <button
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 font-mono text-sm uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" /> {submitting ? "Transmitting..." : "Send Message"}
              </button>
            </form>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="hud-label block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2 text-sm transition"
        maxLength={255}
      />
    </div>
  );
}
