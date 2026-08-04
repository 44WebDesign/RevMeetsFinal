"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "./LocationPicker";
import { ImageField } from "./ImageField";

export type VenueFormValues = {
  name: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  imageUrl: string;
  website: string;
  capacity: string;
  amenities: string;
  categories: string;
  lat: number;
  lng: number;
};

export function VenueForm({ initial }: { initial: VenueFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof VenueFormValues>(k: K, val: VenueFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/venues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        description: v.description,
        address: v.address,
        city: v.city,
        postcode: v.postcode || null,
        imageUrl: v.imageUrl || null,
        website: v.website || null,
        capacity: v.capacity ? Number(v.capacity) : null,
        amenities: v.amenities || null,
        categories: v.categories || null,
        lat: v.lat,
        lng: v.lng,
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
        <label className="field-label">Venue name</label>
        <input className="field-input" value={v.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <label className="field-label">Description</label>
        <textarea className="field-textarea" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }} className="venue-addr">
        <div>
          <label className="field-label">Address</label>
          <input className="field-input" value={v.address} onChange={(e) => set("address", e.target.value)} required />
        </div>
        <div>
          <label className="field-label">City</label>
          <input className="field-input" value={v.city} onChange={(e) => set("city", e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Postcode</label>
          <input className="field-input" value={v.postcode} onChange={(e) => set("postcode", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="field-label">Categories (comma separated)</label>
          <input className="field-input" value={v.categories} onChange={(e) => set("categories", e.target.value)} placeholder="Track, Car Park, Showground" />
        </div>
        <div>
          <label className="field-label">Capacity (optional)</label>
          <input type="number" min={1} className="field-input" value={v.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="field-label">Amenities (comma separated)</label>
        <input className="field-input" value={v.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Parking, Toilets, Catering, Floodlights" />
      </div>
      <ImageField label="Photo (optional)" value={v.imageUrl} onChange={(url) => set("imageUrl", url)} />
      <div>
        <label className="field-label">Website (optional)</label>
        <input className="field-input" value={v.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
      </div>

      <div>
        <label className="field-label">Pin your venue on the map</label>
        <LocationPicker lat={v.lat} lng={v.lng} onChange={(lat, lng) => setV((p) => ({ ...p, lat, lng }))} />
      </div>

      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.3)", color: "#7fd884", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
          <i className="fas fa-check" /> Venue profile saved.
        </div>
      )}

      <button type="submit" className="btn-or-lg" disabled={busy} style={{ alignSelf: "flex-start" }}>
        {busy ? "Saving…" : "Save Venue Profile"}
      </button>

      <style jsx>{`
        @media (max-width: 560px) {
          .venue-addr {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
