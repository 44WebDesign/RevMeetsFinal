"use client";

import { useRef, useState } from "react";

// Cover-image input: upload a file (Vercel Blob) or paste a URL. Falls back
// to URL-only automatically if the server has no blob storage configured.
export function ImageField({
  value,
  onChange,
  label = "Cover image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      onChange(data.url);
    } else {
      setError(data.error ?? "Upload failed");
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch" }}>
        <input
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste an image URL or upload →"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          style={{ whiteSpace: "nowrap" }}
        >
          {busy ? "Uploading…" : <><i className="fas fa-upload" /> Upload</>}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: ".75rem", color: "#ff6b5e", marginTop: ".35rem" }}>{error}</p>
      )}
      {value && !error && (
        <div style={{ marginTop: ".5rem", height: 120, borderRadius: 6, overflow: "hidden", border: "1px solid var(--bdr)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
    </div>
  );
}
