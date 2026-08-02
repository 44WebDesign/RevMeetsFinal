"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ClubFormValues = {
  name: string;
  description: string;
  location: string;
  region: string;
  imageUrl: string;
  website: string;
  categories: string;
};

export function ClubForm({ initial }: { initial: ClubFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ClubFormValues>(k: K, val: ClubFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/clubs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        description: v.description,
        location: v.location,
        region: v.region || null,
        imageUrl: v.imageUrl || null,
        website: v.website || null,
        categories: v.categories || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(
        data.details
          ? Object.entries(data.details).map(([k, val]) => `${k}: ${(val as string[]).join(", ")}`).join(" · ")
          : data.error ?? "Could not save",
      );
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <label className="field-label">Club name</label>
        <input className="field-input" value={v.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <label className="field-label">Description</label>
        <textarea className="field-textarea" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="field-label">Location</label>
          <input className="field-input" value={v.location} onChange={(e) => set("location", e.target.value)} required placeholder="Stratford, London E15" />
        </div>
        <div>
          <label className="field-label">Region (optional)</label>
          <input className="field-input" value={v.region} onChange={(e) => set("region", e.target.value)} placeholder="London" />
        </div>
      </div>
      <div>
        <label className="field-label">Categories (comma separated)</label>
        <input className="field-input" value={v.categories} onChange={(e) => set("categories", e.target.value)} placeholder="Track Days, Meets, JDM" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="field-label">Logo / cover image URL (optional)</label>
          <input className="field-input" value={v.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="field-label">Website (optional)</label>
          <input className="field-input" value={v.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.3)", color: "#7fd884", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
          <i className="fas fa-check" /> Club profile saved.
        </div>
      )}

      <button type="submit" className="btn-or-lg" disabled={busy} style={{ alignSelf: "flex-start" }}>
        {busy ? "Saving…" : "Save Club Profile"}
      </button>
    </form>
  );
}
