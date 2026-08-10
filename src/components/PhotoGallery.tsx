"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  uploaderId: string;
  uploaderName: string;
  avatarColor: string;
};

// Reusable photo grid used for member build galleries and event photo walls.
// When `canAdd` is set it shows an inline uploader (file → Vercel Blob, or a
// pasted URL) that posts to /api/photos.
export function PhotoGallery({
  title,
  photos,
  eventId,
  canAdd,
  currentUserId,
  isAdmin = false,
  emptyText = "No photos yet.",
  addPrompt = "Add a photo",
}: {
  title: string;
  photos: GalleryPhoto[];
  eventId?: string;
  canAdd: boolean;
  currentUserId: string | null;
  isAdmin?: boolean;
  emptyText?: string;
  addPrompt?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setUrl(data.url);
    else setError(data.error ?? "Upload failed");
    setUploading(false);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!url) {
      setError("Add an image first");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, caption: caption || null, eventId: eventId ?? null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUrl("");
      setCaption("");
      router.refresh();
    } else {
      setError(data.error ?? "Could not add photo");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ marginTop: "2.5rem" }}>
      <h2 className="hd" style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>
        {title} ({photos.length})
      </h2>

      {canAdd && (
        <form onSubmit={add} className="card-surface" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <label className="field-label">{addPrompt}</label>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch", flexWrap: "wrap" }}>
            <input
              className="field-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste an image URL or upload →"
              style={{ flex: "1 1 220px" }}
            />
            <button type="button" className="btn-ghost" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ whiteSpace: "nowrap" }}>
              {uploading ? "Uploading…" : <><i className="fas fa-upload" /> Upload</>}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <input
            className="field-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={200}
            style={{ marginTop: ".5rem" }}
          />
          {url && (
            <div style={{ marginTop: ".6rem", height: 120, borderRadius: 6, overflow: "hidden", border: "1px solid var(--bdr)", width: "fit-content" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preview" style={{ height: "100%", objectFit: "cover" }} />
            </div>
          )}
          {error && <p style={{ fontSize: ".8rem", color: "#ff6b5e", marginTop: ".5rem" }}>{error}</p>}
          <button type="submit" className="btn-or" disabled={busy} style={{ marginTop: ".75rem" }}>
            {busy ? "Saving…" : "Add Photo"}
          </button>
        </form>
      )}

      {photos.length === 0 ? (
        <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1rem" }}>
          {photos.map((p) => {
            const canDelete = isAdmin || p.uploaderId === currentUserId;
            return (
              <div key={p.id} className="card-surface" style={{ overflow: "hidden", position: "relative" }}>
                <button
                  onClick={() => setLightbox(p)}
                  style={{ display: "block", width: "100%", height: 160, border: "none", padding: 0, cursor: "pointer", background: "#000" }}
                  aria-label="View photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption || "Photo"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
                <div style={{ padding: ".6rem .75rem" }}>
                  {p.caption && (
                    <p style={{ fontSize: ".8rem", color: "rgba(245,245,245,.85)", marginBottom: ".35rem", lineHeight: 1.4 }}>{p.caption}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".72rem", color: "var(--mut)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: p.avatarColor, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: ".55rem", fontWeight: 700 }}>
                      {p.uploaderName.slice(0, 2).toUpperCase()}
                    </span>
                    {p.uploaderName}
                  </div>
                </div>
                {canDelete && (
                  <button
                    onClick={() => remove(p.id)}
                    aria-label="Delete photo"
                    style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: ".7rem" }}
                  >
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", cursor: "zoom-out" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt={lightbox.caption || "Photo"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
