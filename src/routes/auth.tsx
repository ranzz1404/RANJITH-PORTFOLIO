import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "ranjithkumar41690rk@gmail.com";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      toast.error("Access Denied - Unauthorized personnel");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error("Invalid credentials");
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-40" />
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 hud-label hover:text-accent transition">
        <ArrowLeft className="w-3 h-3" /> Back to portfolio
      </Link>
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md border border-border bg-panel p-8 space-y-5">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 border border-accent items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <p className="hud-label text-accent mt-4">// RESTRICTED ACCESS</p>
          <h1 className="text-2xl font-bold mt-2">Admin Login</h1>
          <p className="text-xs text-muted-foreground mt-1">Authorized personnel only</p>
        </div>
        <div>
          <label className="hud-label block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2.5 text-sm transition"
            required
          />
        </div>
        <div>
          <label className="hud-label block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2.5 text-sm transition"
            required
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-accent text-accent-foreground py-3 font-mono text-sm uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 transition"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
