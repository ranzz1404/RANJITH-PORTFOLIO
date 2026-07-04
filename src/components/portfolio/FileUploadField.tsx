import { useRef, useState, useCallback } from "react";
import { Upload, Loader2, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
const LONG_EXPIRY = 60 * 60 * 24 * 365 * 50; // ~50 years
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,application/pdf";

export function FileUploadField({
  bucket,
  currentUrl,
  onUploaded,
}: {
  bucket: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File exceeds 20MB");
        return;
      }
      setUploading(true);
      setProgress(10);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        setProgress(40);
        const { error: upErr } = await sb.storage.from(bucket).upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (upErr) throw upErr;
        setProgress(75);
        const { data: signed, error: sErr } = await sb.storage
          .from(bucket)
          .createSignedUrl(path, LONG_EXPIRY);
        if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Signed URL failed");
        setProgress(100);
        onUploaded(signed.signedUrl);
        toast.success("Uploaded — URL auto-filled");
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [bucket, onUploaded]
  );

  const isImage = currentUrl && !/\.pdf(\?|$)/i.test(currentUrl);

  return (
    <div className="mt-2 border border-dashed border-border p-3 bg-background/40">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="hud-label">// UPLOAD FILE ({bucket})</p>
        {currentUrl && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentUrl);
                toast.success("URL copied");
              }}
              title="Copy URL"
              className="p-1.5 border border-border hover:border-accent hover:text-accent"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View"
              className="p-1.5 border border-border hover:border-accent hover:text-accent inline-flex"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => onUploaded("")}
              title="Clear URL"
              className="p-1.5 border border-border hover:border-destructive hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`cursor-pointer flex items-center gap-3 p-3 border border-border transition ${
          dragOver ? "border-accent bg-accent/5" : "hover:border-accent/60"
        }`}
      >
        <div className="w-10 h-10 border border-accent flex items-center justify-center text-accent shrink-0">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono">
            {uploading ? `Uploading… ${progress}%` : "Click, drop, or tap + to upload"}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            JPG · PNG · WEBP · SVG · PDF · max 20MB
          </p>
          {uploading && (
            <div className="mt-1 h-1 w-full bg-border">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <span className="text-2xl leading-none text-accent font-mono">+</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      {currentUrl && isImage && (
        <img
          src={currentUrl}
          alt="preview"
          loading="lazy"
          className="mt-2 max-h-32 object-contain border border-border"
        />
      )}
    </div>
  );
}

export default FileUploadField;
