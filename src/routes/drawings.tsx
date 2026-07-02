import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Download, FileText, Loader as Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/portfolio/Navbar";

const sb = supabase as any;
const BUCKET = "drawings";

export const Route = createFileRoute("/drawings")({
  head: () => ({
    meta: [
      { title: "Drawings — Ranjith Kumar K" },
      { name: "description", content: "Technical drawings and CAD sketches." },
    ],
  }),
  component: DrawingsPage,
});

type StoredFile = {
  name: string;
  updated_at?: string;
  metadata?: { size?: number; mimetype?: string };
};

function DrawingsPage() {
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: admin } = await sb.rpc("is_current_user_admin");
      setIsAdmin(Boolean(admin));
    })();
  }, []);

  const filesQuery = useQuery({
    queryKey: ["storage", BUCKET],
    queryFn: async () => {
      const { data, error } = await sb.storage.from(BUCKET).list("", {
        limit: 200,
        sortBy: { column: "updated_at", order: "desc" },
      });
      if (error) throw error;
      return (data ?? []) as StoredFile[];
    },
  });

  useEffect(() => {
    (async () => {
      if (!filesQuery.data) return;
      const urls: Record<string, string> = {};
      for (const f of filesQuery.data) {
        const { data } = await sb.storage.from(BUCKET).createSignedUrl(f.name, 3600);
        if (data?.signedUrl) urls[f.name] = data.signedUrl;
      }
      setSignedUrls(urls);
    })();
  }, [filesQuery.data]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const ext = file.name.split(".").pop();
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error } = await sb.storage.from(BUCKET).upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
          if (error) throw error;
        }
        toast.success("Uploaded");
        qc.invalidateQueries({ queryKey: ["storage", BUCKET] });
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [qc]
  );

  async function handleDelete(name: string) {
    if (!confirm("Delete this file?")) return;
    const { error } = await sb.storage.from(BUCKET).remove([name]);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["storage", BUCKET] });
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative z-10">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <Link to="/" className="hud-label text-accent inline-flex items-center gap-2 mb-6">
          <ArrowLeft className="w-3 h-3" /> BACK
        </Link>
        <header className="mb-10">
          <p className="hud-label text-accent">// GALLERY</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Drawings</h1>
          <div className="mt-4 h-px w-16 bg-accent" />
        </header>

        {isAdmin && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed p-8 mb-8 text-center transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-sm text-muted-foreground mb-3">Drag & drop PDF / JPG / PNG / WEBP files here</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-accent-foreground transition text-xs font-mono uppercase tracking-wider"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Choose Files
            </button>
          </div>
        )}

        {filesQuery.isLoading ? (
          <p className="hud-label">// LOADING...</p>
        ) : !filesQuery.data?.length ? (
          <p className="text-muted-foreground text-sm">No drawings uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filesQuery.data.map((f) => {
              const url = signedUrls[f.name];
              const isPdf = f.metadata?.mimetype === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
              return (
                <div key={f.name} className="border border-border bg-card overflow-hidden group relative">
                  <button
                    onClick={() => url && !isPdf && setLightbox(url)}
                    className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden"
                  >
                    {isPdf ? (
                      <FileText className="w-10 h-10 text-accent" />
                    ) : url ? (
                      <img src={url} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </button>
                  <div className="p-2 border-t border-border flex gap-1">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center text-[10px] font-mono uppercase border border-border px-1 py-1 hover:border-accent hover:text-accent"
                      >
                        Open
                      </a>
                    )}
                    {url && (
                      <a href={url} download className="border border-border px-2 py-1 hover:border-accent hover:text-accent">
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(f.name)}
                        className="border border-border px-2 py-1 hover:border-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button className="absolute top-4 right-4 p-2 border border-border text-accent">
              <X className="w-4 h-4" />
            </button>
            <img src={lightbox} alt="preview" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </main>
    </div>
  );
}
