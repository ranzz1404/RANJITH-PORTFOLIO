import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, ArrowLeft, Plus, Trash2, Save, User, FolderKanban, Wrench, Award, Briefcase, Image, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "ranjithkumar41690rk@gmail.com";
const sb = supabase as any;

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type TabKey = "profile" | "projects" | "skills" | "certificates" | "internships" | "drawings" | "social_links";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "internships", label: "Internships", icon: Briefcase },
  { key: "drawings", label: "Drawings", icon: Image },
  { key: "social_links", label: "Social Links", icon: Share2 },
];

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<TabKey>("profile");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        toast.error("Access restricted");
        navigate({ to: "/" });
        return;
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-background flex items-center justify-center hud-label">// AUTHENTICATING...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="hud-label hover:text-accent transition inline-flex items-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Portfolio
            </Link>
            <span className="hud-label text-accent">// ADMIN CONSOLE</span>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 border border-border hover:border-accent hover:text-accent px-4 py-2 text-xs font-mono uppercase tracking-wider transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        <aside className="md:w-56 md:border-r border-border md:min-h-[calc(100vh-4rem)] p-3">
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition ${
                    tab === t.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-panel"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-8 min-w-0">
          {tab === "profile" && <ProfileEditor />}
          {tab === "projects" && <CrudTable table="projects" fields={projectFields} title="Projects" />}
          {tab === "skills" && <CrudTable table="skills" fields={skillFields} title="Skills" />}
          {tab === "certificates" && <CrudTable table="certificates" fields={certFields} title="Certificates" />}
          {tab === "internships" && <CrudTable table="internships" fields={internshipFields} title="Internships" />}
          {tab === "drawings" && <CrudTable table="drawings" fields={drawingFields} title="Drawings" />}
          {tab === "social_links" && <CrudTable table="social_links" fields={socialFields} title="Social Links" />}
        </main>
      </div>
    </div>
  );
}

function ProfileEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await sb.from("profile").select("*").limit(1).maybeSingle()).data,
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  async function save() {
    const payload = { ...form, updated_at: new Date().toISOString() };
    let res;
    if (form.id) {
      res = await sb.from("profile").update(payload).eq("id", form.id);
    } else {
      res = await sb.from("profile").insert(payload);
    }
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  if (isLoading) return <p className="hud-label">// LOADING...</p>;

  const fields: { key: string; label: string; type?: string; textarea?: boolean }[] = [
    { key: "full_name", label: "Full Name" },
    { key: "headline", label: "Headline" },
    { key: "tagline", label: "Tagline" },
    { key: "bio", label: "Bio", textarea: true },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
    { key: "career_goal", label: "Career Goal" },
    { key: "avatar_url", label: "Avatar URL" },
    { key: "resume_url", label: "Resume URL (Google Drive / direct PDF)" },
    { key: "linkedin_url", label: "LinkedIn URL" },
    { key: "github_url", label: "GitHub URL" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Profile</h2>
      <p className="hud-label mb-6">// EDIT YOUR IDENTITY</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
            <label className="hud-label block mb-2">{f.label}</label>
            {f.textarea ? (
              <textarea
                rows={4}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-panel border border-border focus:border-accent outline-none px-3 py-2 text-sm transition"
              />
            ) : (
              <input
                type={f.type ?? "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-panel border border-border focus:border-accent outline-none px-3 py-2 text-sm transition"
              />
            )}
          </div>
        ))}
      </div>
      {form.avatar_url && (
        <div className="mt-4">
          <p className="hud-label mb-2">Avatar Preview</p>
          <img src={form.avatar_url} alt="" className="w-24 h-24 object-cover border border-border" />
        </div>
      )}
      <button onClick={save} className="mt-6 inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-mono text-sm uppercase tracking-wider hover:bg-accent/90 transition">
        <Save className="w-4 h-4" /> Save Profile
      </button>
    </div>
  );
}

type FieldDef = { key: string; label: string; type?: "text" | "number" | "date" | "textarea" | "list" };

const projectFields: FieldDef[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image_url", label: "Image URL" },
  { key: "materials", label: "Materials" },
  { key: "project_type", label: "Type (e.g. Team Project)" },
  { key: "category", label: "Category" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];
const skillFields: FieldDef[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "level", label: "Level (e.g. In Progress)" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];
const certFields: FieldDef[] = [
  { key: "title", label: "Title" },
  { key: "issuer", label: "Issuer" },
  { key: "issued_date", label: "Issued Date", type: "date" },
  { key: "type", label: "Type (general / internship)" },
  { key: "image_url", label: "Image URL" },
  { key: "certificate_url", label: "Certificate URL" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];
const internshipFields: FieldDef[] = [
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "duration", label: "Duration" },
  { key: "learnings", label: "Learnings (one per line)", type: "list" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];
const drawingFields: FieldDef[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image_url", label: "Image URL" },
  { key: "category", label: "Category (Drawing / Photo / Sketch)" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];
const socialFields: FieldDef[] = [
  { key: "label", label: "Label" },
  { key: "url", label: "URL" },
  { key: "icon", label: "Icon (e.g. linkedin, mail)" },
  { key: "sort_order", label: "Sort Order", type: "number" },
];

function CrudTable({ table, fields, title }: { table: string; fields: FieldDef[]; title: string }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: [table, "admin"],
    queryFn: async () => {
      const { data } = await sb.from(table).select("*").order("sort_order", { ascending: true });
      return (data ?? []) as any[];
    },
  });
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [adding, setAdding] = useState<any | null>(null);

  function startEdit(row: any) {
    setDrafts({ ...drafts, [row.id]: { ...row, learnings: Array.isArray(row.learnings) ? row.learnings.join("\n") : row.learnings } });
  }
  function cancelEdit(id: string) {
    const d = { ...drafts }; delete d[id]; setDrafts(d);
  }
  function normalize(row: any) {
    const out = { ...row };
    fields.forEach((f) => {
      if (f.type === "list" && typeof out[f.key] === "string") {
        out[f.key] = out[f.key].split("\n").map((s: string) => s.trim()).filter(Boolean);
      }
      if (f.type === "number") out[f.key] = Number(out[f.key]) || 0;
      if (f.type === "date" && !out[f.key]) out[f.key] = null;
    });
    return out;
  }
  async function saveRow(id: string) {
    const row = normalize(drafts[id]);
    const { id: _, ...rest } = row;
    const { error } = await sb.from(table).update(rest).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    cancelEdit(id);
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: [table, "admin"] });
  }
  async function deleteRow(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: [table, "admin"] });
  }
  async function addRow() {
    if (!adding) return;
    const row = normalize(adding);
    const { error } = await sb.from(table).insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    setAdding(null);
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: [table, "admin"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="hud-label">// {data.length} ITEM{data.length === 1 ? "" : "S"}</p>
        </div>
        <button
          onClick={() => setAdding(Object.fromEntries(fields.map((f) => [f.key, f.type === "number" ? 0 : ""])))}
          className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-accent/90 transition"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {adding && (
        <div className="mb-6 border border-accent bg-panel p-5">
          <p className="hud-label text-accent mb-4">// NEW ENTRY</p>
          <RowForm fields={fields} value={adding} onChange={setAdding} />
          <div className="mt-4 flex gap-2">
            <button onClick={addRow} className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 text-xs font-mono uppercase tracking-wider"><Save className="w-3 h-3" /> Save</button>
            <button onClick={() => setAdding(null)} className="border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      {isLoading && <p className="hud-label">// LOADING...</p>}

      <div className="space-y-3">
        {data.map((row: any) => {
          const editing = drafts[row.id];
          return (
            <div key={row.id} className="border border-border bg-panel p-5">
              {editing ? (
                <>
                  <RowForm fields={fields} value={editing} onChange={(v) => setDrafts({ ...drafts, [row.id]: v })} />
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => saveRow(row.id)} className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 text-xs font-mono uppercase tracking-wider"><Save className="w-3 h-3" /> Save</button>
                    <button onClick={() => cancelEdit(row.id)} className="border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider">Cancel</button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{row[fields[0].key]}</p>
                    {fields[1] && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{Array.isArray(row[fields[1].key]) ? row[fields[1].key].join(", ") : row[fields[1].key]}</p>}
                    <p className="hud-label mt-2">SORT: {row.sort_order ?? 0}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(row)} className="border border-border hover:border-accent hover:text-accent px-3 py-1.5 text-xs font-mono uppercase">Edit</button>
                    <button onClick={() => deleteRow(row.id)} className="border border-border hover:border-destructive hover:text-destructive p-1.5"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RowForm({ fields, value, onChange }: { fields: FieldDef[]; value: any; onChange: (v: any) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.key} className={f.type === "textarea" || f.type === "list" ? "sm:col-span-2" : ""}>
          <label className="hud-label block mb-2">{f.label}</label>
          {f.type === "textarea" || f.type === "list" ? (
            <textarea
              rows={f.type === "list" ? 5 : 3}
              value={value[f.key] ?? ""}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2 text-sm transition"
            />
          ) : (
            <input
              type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
              value={value[f.key] ?? ""}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              className="w-full bg-background border border-border focus:border-accent outline-none px-3 py-2 text-sm transition"
            />
          )}
        </div>
      ))}
    </div>
  );
}
