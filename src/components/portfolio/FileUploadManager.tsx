import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Plus, Trash2, Download, Eye, Copy, Pencil, RefreshCw, FileText, Loader as Loader2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

const ACCEPTED = "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type StoredFile = {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: { size?: number; mimetype?: string };
};

type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  path?: string;
};

function formatSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function isImage(mime?: string, name?: string) {
  if (mime) return mime.startsWith("image/");
  return /\.(jpg|jpeg|png|webp|svg)$/i.test(name ?? "");
}

function isPdf(mime?: string, name?: string) {
  if (mime === "application/pdf") return true;
  return /\.pdf$/i.test(name ?? "");
}

function publicUrl(bucket: string, path: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  return url;
}

export function FileUploadManager({
  bucket,
  onUseUrl,
}: {
  bucket: string;
  onUseUrl: (url: string) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const filesQuery = useQuery({
    queryKey: ["storage", bucket, "manager"],
    queryFn: async () => {
      const { data, error } = await sb.storage.from(bucket).list("", {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      return (data ?? []) as StoredFile[];
    },
  });

  // Lazy signed URLs for previews (only for visible files).
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!filesQuery.data) return;
      const out: Record<string, string> = {};
      for (const f of filesQuery.data) {
        const { data } = await sb.storage.from(bucket).createSignedUrl(f.name, 3600);
        if (data?.signedUrl) out[f.name] = data.signedUrl;
      }
      if (!cancelled) setUrls(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [filesQuery.data, bucket]);

  const uploadOne = useCallback(
    (file: File) =>
      new Promise<UploadTask>((resolve) => {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const task: UploadTask = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          progress: 0,
          status: "uploading",
        };
        setTasks((t) => [task, ...t]);

        const up = sb.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }, {
            onUploadProgress: (e: any) => {
              if (e.total) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, progress: pct } : x)));
              }
            },
          });

        up.then(
          ({ error }: any) => {
            if (error) {
              setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "error", error: error.message } : x)));
              resolve({ ...task, status: "error", error: error.message });
            } else {
              setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "done", progress: 100, path } : x)));
              qc.invalidateQueries({ queryKey: ["storage", bucket] });
              qc.invalidateQueries({ queryKey: ["storage", bucket, "manager"] });
              resolve({ ...task, status: "done", progress: 100, path });
            }
          },
          (err: any) => {
            setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: "error", error: err?.message ?? "Upload failed" } : x)));
            resolve({ ...task, status: "error", error: err?.message });
          }
        );
      }),
    [bucket, qc]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return;
      const arr = Array.from(files);
      for (const f of arr) {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} exceeds 10 MB`);
          continue;
        }
      }
      const valid = arr.filter((f) => f.size <= MAX_BYTES);
      if (!valid.length) return;
      await Promise.all(valid.map(uploadOne));
      toast.success(`Uploaded ${valid.length} file${valid.length === 1 ? "" : "s"}`);
    },
    [uploadOne]
  );

  async function handleDelete(name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await sb.storage.from(bucket).remove([name]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["storage", bucket] });
    qc.invalidateQueries({ queryKey: ["storage", bucket, "manager"] });
  }

  async function handleRename(oldName: string) {
    const newName = renameVal.trim();
    if (!newName || newName === oldName) {
      setRenaming(null);
      return;
    }
    // Supabase storage has no rename; copy then delete.
    const { data, error: dlErr } = await sb.storage.from(bucket).download(oldName);
    if (dlErr || !data) {
      toast.error(dlErr?.message ?? "Download failed");
      return;
    }
    const { error: upErr } = await sb.storage.from(bucket).upload(newName, data, { upsert: false });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    await sb.storage.from(bucket).remove([oldName]);
    toast.success("Renamed");
    setRenaming(null);
    setRenameVal("");
    qc.invalidateQueries({ queryKey: ["storage", bucket] });
    qc.invalidateQueries({ queryKey: ["storage", bucket, "manager"] });
  }

  async function handleReplace(name: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const { error } = await sb.storage.from(bucket).upload(name, f, { upsert: true, contentType: f.type });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Replaced");
      qc.invalidateQueries({ queryKey: ["storage", bucket] });
      qc.invalidateQueries({ queryKey: ["storage", bucket, "manager"] });
    };
    input.click();
  }

  function copyUrl(name: string) {
    const url = publicUrl(bucket, name);
    navigator.clipboard.writeText(url).then(
      () => toast.success("URL copied"),
      () => toast.error("Copy failed")
    );
  }

  function useInForm(name: string) {
    onUseUrl(publicUrl(bucket, name));
    toast.success("Image URL filled");
  }

  function clearDone() {
    setTasks((t) => t.filter((x) => x.status === "uploading"));
  }

  return (
    <div className="border border-border bg-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="hud-label text-accent">// UPLOAD FILES</p>
          <p className="text-xs text-muted-foreground mt-1">JPG · PNG · WEBP · SVG · PDF — max 10 MB</p>
        </div>
        {tasks.some((t) => t.status !== "uploading") && (
          <button onClick={clearDone} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed p-6 mb-4 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <button
          onClick={() => inputRef.current?.click()}
          className="mx-auto flex flex-col items-center gap-2 group"
          aria-label="Browse files"
        >
          <span className="w-14 h-14 border-2 border-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition">
            <Plus className="w-7 h-7 text-accent group-hover:text-accent-foreground" />
          </span>
          <span className="text-sm text-muted-foreground">Drag & drop or click to browse</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Active uploads with progress */}
      {tasks.length > 0 && (
        <div className="space-y-2 mb-4">
          {tasks.map((t) => (
            <div key={t.id} className="border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono truncate flex-1">{t.file.name}</span>
                {t.status === "uploading" && <Loader2 className="w-3 h-3 animate-spin text-accent shrink-0" />}
                {t.status === "done" && <Check className="w-3 h-3 text-accent shrink-0" />}
                {t.status === "error" && <X className="w-3 h-3 text-destructive shrink-0" />}
              </div>
              <div className="h-1.5 w-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${t.status === "error" ? "bg-destructive" : "bg-accent"}`}
                  style={{ width: `${t.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {t.status === "uploading" && `${t.progress}%`}
                  {t.status === "done" && "Complete"}
                  {t.status === "error" && (t.error ?? "Failed")}
                </span>
                {t.status === "error" && (
                  <button onClick={() => uploadOne(t.file)} className="text-[10px] font-mono uppercase text-accent hover:underline">
                    Retry
                  </button>
                )}
                {t.status === "done" && t.path && (
                  <button onClick={() => useInForm(t.path!)} className="text-[10px] font-mono uppercase text-accent hover:underline">
                    Use in form
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {filesQuery.isLoading && <p className="hud-label">// LOADING FILES...</p>}
      {filesQuery.error && <p className="text-xs text-destructive">Failed to load files</p>}

      {filesQuery.data && filesQuery.data.length === 0 && !tasks.length && (
        <p className="text-xs text-muted-foreground text-center py-4">No files uploaded yet.</p>
      )}

      {filesQuery.data && filesQuery.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filesQuery.data.map((f) => {
            const url = urls[f.name];
            const img = isImage(f.metadata?.mimetype, f.name);
            const pdf = isPdf(f.metadata?.mimetype, f.name);
            return (
              <div key={f.name} className="border border-border bg-background overflow-hidden flex flex-col">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {img && url ? (
                    <img src={url} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : pdf ? (
                    <FileText className="w-8 h-8 text-accent" />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2 flex-1 flex flex-col">
                  {renaming === f.name ? (
                    <div className="flex gap-1 mb-1">
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(f.name);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        className="flex-1 min-w-0 bg-panel border border-accent text-xs px-1 py-0.5 outline-none"
                      />
                      <button onClick={() => handleRename(f.name)} className="text-accent">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setRenaming(null)} className="text-muted-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono truncate" title={f.name}>{f.name}</p>
                  )}
                  <p className="hud-label mt-0.5">{formatSize(f.metadata?.size)} · {formatDate(f.created_at ?? f.updated_at)}</p>
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <IconBtn title="View" onClick={() => url && setPreview(url)}>
                      <Eye className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Copy URL" onClick={() => copyUrl(f.name)}>
                      <Copy className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Use in form" onClick={() => useInForm(f.name)} accent>
                      <Upload className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Rename" onClick={() => { setRenaming(f.name); setRenameVal(f.name); }}>
                      <Pencil className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Replace" onClick={() => handleReplace(f.name)}>
                      <RefreshCw className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Download" onClick={() => url && (window.location.href = url)}>
                      <Download className="w-3 h-3" />
                    </IconBtn>
                    <IconBtn title="Delete" onClick={() => handleDelete(f.name)} danger>
                      <Trash2 className="w-3 h-3" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button className="absolute top-4 right-4 p-2 border border-border text-accent">
            <X className="w-4 h-4" />
          </button>
          {preview.toLowerCase().endsWith(".pdf") ? (
            <iframe src={preview} title="preview" className="w-full h-full max-w-4xl max-h-[90vh] border border-border" />
          ) : (
            <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  accent,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center border border-border p-1.5 hover:border-accent transition ${
        accent ? "text-accent hover:bg-accent hover:text-accent-foreground" : ""
      } ${danger ? "hover:border-destructive hover:text-destructive" : ""}`}
    >
      {children}
    </button>
  );
}
