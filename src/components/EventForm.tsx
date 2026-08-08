"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LocationPicker } from "./LocationPicker";
import { ImageField } from "./ImageField";
import { AmenityPicker } from "./AmenityPicker";
import { amenityKeys, serializeAmenities } from "@/lib/amenities";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/enums";

type VenueOption = {
  id: string;
  name: string;
  city: string;
  amenities?: string;
  lat?: number;
  lng?: number;
};

export type EventFormValues = {
  title: string;
  type: string;
  description: string;
  startsAt: string; // datetime-local string
  endsAt: string;
  city: string;
  region: string;
  address: string;
  priceInfo: string;
  capacity: string;
  imageUrl: string;
  lat: number;
  lng: number;
  status: string;
  venueId: string;
  amenities: string;
};

const EMPTY: EventFormValues = {
  title: "",
  type: "CAR_SHOW",
  description: "",
  startsAt: "",
  endsAt: "",
  city: "",
  region: "",
  address: "",
  priceInfo: "",
  capacity: "",
  imageUrl: "",
  lat: 52.4862,
  lng: -1.8904,
  status: "PUBLISHED",
  venueId: "",
  amenities: "",
};

export function EventForm({
  mode,
  eventId,
  initial,
}: {
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<EventFormValues>;
}) {
  const router = useRouter();
  const [v, setV] = useState<EventFormValues>({ ...EMPTY, ...initial });
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [recurrence, setRecurrence] = useState("NONE");
  const [occurrences, setOccurrences] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((d) => setVenues(d.venues ?? []))
      .catch(() => {});
  }, []);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  // Selecting a venue pulls its amenities through as the starting selection
  // (still fully editable below) and drops the pin at the venue's location.
  function selectVenue(venueId: string) {
    const venue = venues.find((x) => x.id === venueId);
    setV((prev) => ({
      ...prev,
      venueId,
      ...(venue
        ? {
            amenities: venue.amenities ?? prev.amenities,
            ...(venue.lat != null && venue.lng != null ? { lat: venue.lat, lng: venue.lng } : {}),
            city: prev.city || venue.city,
          }
        : {}),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      title: v.title,
      type: v.type,
      description: v.description,
      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : "",
      endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
      city: v.city,
      region: v.region || null,
      address: v.address || null,
      priceInfo: v.priceInfo || null,
      capacity: v.capacity ? Number(v.capacity) : null,
      imageUrl: v.imageUrl || null,
      lat: v.lat,
      lng: v.lng,
      status: v.status,
      venueId: v.venueId || null,
      amenities: v.amenities || "",
      ...(mode === "create" && recurrence !== "NONE"
        ? { recurrence, occurrences }
        : {}),
    };

    const res = await fetch(mode === "create" ? "/api/events" : `/api/events/${eventId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/events/${data.slug}`);
      router.refresh();
    } else {
      setError(
        data.details
          ? Object.entries(data.details).map(([k, val]) => `${k}: ${(val as string[]).join(", ")}`).join(" · ")
          : data.error ?? "Could not save event",
      );
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Could not delete event");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Row>
        <Field label="Event title" full>
          <input className="field-input" value={v.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Midlands Tuner Festival" />
        </Field>
      </Row>

      <Row>
        <Field label="Event type">
          <select className="field-select" value={v.type} onChange={(e) => set("type", e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="field-select" value={v.status} onChange={(e) => set("status", e.target.value)}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft (hidden)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </Field>
      </Row>

      <Field label="Description" full>
        <textarea className="field-textarea" rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} required placeholder="Tell attendees what to expect…" />
      </Field>

      <Row>
        <Field label="Starts at">
          <input type="datetime-local" className="field-input" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
        </Field>
        <Field label="Ends at (optional)">
          <input type="datetime-local" className="field-input" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
      </Row>

      <Row>
        <Field label="City / town">
          <input className="field-input" value={v.city} onChange={(e) => set("city", e.target.value)} required placeholder="Birmingham" />
        </Field>
        <Field label="Region (optional)">
          <input className="field-input" value={v.region} onChange={(e) => set("region", e.target.value)} placeholder="West Midlands" />
        </Field>
      </Row>

      <Field label="Address / meeting point (optional)" full>
        <input className="field-input" value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Full address or landmark" />
      </Field>

      <div>
        <label className="field-label">Venue (optional)</label>
        <select className="field-select" value={v.venueId} onChange={(e) => selectVenue(e.target.value)}>
          <option value="">No venue — custom location</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} — {venue.city}
            </option>
          ))}
        </select>
        <p style={{ fontSize: ".72rem", color: "var(--mut)", marginTop: ".35rem" }}>
          Picking a venue links it on the event page and pulls in its amenities and location — adjust either below.
        </p>
      </div>

      <div>
        <label className="field-label">Amenities at this event</label>
        <AmenityPicker
          value={amenityKeys(v.amenities)}
          onChange={(keys) => set("amenities", serializeAmenities(keys))}
        />
      </div>

      <Row>
        <Field label="Entry / price info (optional)">
          <input className="field-input" value={v.priceInfo} onChange={(e) => set("priceInfo", e.target.value)} placeholder="Free / £10 on the gate" />
        </Field>
        <Field label="Capacity (optional)">
          <input type="number" min={1} className="field-input" value={v.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Unlimited" />
        </Field>
      </Row>

      <ImageField label="Cover image (optional)" value={v.imageUrl} onChange={(url) => set("imageUrl", url)} />

      <div>
        <label className="field-label">Pin the location</label>
        <LocationPicker lat={v.lat} lng={v.lng} onChange={(lat, lng) => setV((p) => ({ ...p, lat, lng }))} />
        <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
          <Field label="Latitude">
            <input type="number" step="any" className="field-input" value={v.lat} onChange={(e) => set("lat", Number(e.target.value))} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" className="field-input" value={v.lng} onChange={(e) => set("lng", Number(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Recurring (create only) */}
      {mode === "create" && (
        <div className="card-surface" style={{ padding: "1rem 1.25rem", background: "var(--bg)" }}>
          <label className="field-label" style={{ marginBottom: ".5rem" }}>
            <i className="fas fa-repeat" /> Repeat this event
          </label>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <select className="field-select" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="NONE">One-off (doesn&apos;t repeat)</option>
                <option value="WEEKLY">Weekly</option>
                <option value="FORTNIGHTLY">Every 2 weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            {recurrence !== "NONE" && (
              <div style={{ flex: "1 1 120px" }}>
                <label className="field-label">Number of dates</label>
                <input type="number" min={2} max={26} className="field-input" value={occurrences} onChange={(e) => setOccurrences(Number(e.target.value))} />
              </div>
            )}
          </div>
          {recurrence !== "NONE" && (
            <p style={{ fontSize: ".72rem", color: "var(--mut)", marginTop: ".5rem" }}>
              Creates {occurrences} separate events, each with its own page and registrations, starting from the date above.
            </p>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: ".75rem", justifyContent: "space-between", flexWrap: "wrap" }}>
        <button type="submit" className="btn-or-lg" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Publish Event" : "Save Changes"}
        </button>
        {mode === "edit" && (
          <button type="button" onClick={remove} className="btn-ghost-lg" disabled={busy} style={{ borderColor: "rgba(244,67,54,.4)", color: "#ff6b5e" }}>
            <i className="fas fa-trash" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-row">
      {children}
      <style jsx>{`
        @media (max-width: 560px) {
          .form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: "1 / -1", flex: 1 } : { flex: 1 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
