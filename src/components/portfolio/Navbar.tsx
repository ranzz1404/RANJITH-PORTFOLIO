import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Menu, X } from "lucide-react";

const SECTIONS = ["home", "about", "skills", "projects", "drawings", "internships", "certificates", "contact"];

export function Navbar() {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => scrollTo("home")} className="logo-pulse inline-block font-display font-bold text-lg tracking-tight transition">
          RK<span className="text-accent">.</span>
        </button>
        <nav className="hidden md:flex items-center gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                active === s ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" aria-label="Admin login" className="p-2 border border-border hover:border-accent hover:text-accent transition">
            <Lock className="w-4 h-4" />
          </Link>
          <button className="md:hidden p-2 border border-border" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-background">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className={`block w-full text-left px-6 py-3 text-sm font-mono uppercase tracking-wider border-b border-border ${
                active === s ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
