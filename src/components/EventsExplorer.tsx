"use client";

import { useMemo, useState } from "react";
import { MapView, type MapPoint } from "./MapView";
import { EventCard } from "./EventCard";
import { AmenityFilter } from "./AmenityFilter";
import { hasAllAmenities } from "@/lib/amenities";
import { distanceKm } from "@/lib/utils";
import type { ExplorerEvent } from "@/lib/queries";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  eventTypeColor,
} from "@/lib/enums";

type LatLng = { lat: number; lng: number };
const RADII = [0, 5, 10, 25, 50, 100];

export type ExplorerInitial = {
  q?: string;
  city?: string;
  type?: string;
  from?: string;
  to?: string;
  amenities?: string[];
};

export function EventsExplorer({
  events,
  initial = {},
}: {
  events: ExplorerEvent[];
  initial?: ExplorerInitial;
}) {
  const [view, setView] = useState<"map" | "list">("map");
  const [q, setQ] = useState(initial.q ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [type, setType] = useState(initial.type ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [amenities, setAmenities] = useState<string[]>(initial.amenities ?? []);
  const [showAmenities, setShowAmenities] = useState((initial.amenities ?? []).length > 0);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<(LatLng & { zoom?: number }) | null>(null);
  const [radius, setRadius] = useState(25);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setFocus({ ...loc, zoom: radius && radius <= 10 ? 11 : 9 });
        setView("map");
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow it to search near you."
            : "Couldn't get your location. Try again.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function clearAll() {
    setQ("");
    setCity("");
    setType("");
    setFrom("");
    setTo("");
    setAmenities([]);
    setUserLocation(null);
    setFocus(null);
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cityQ = city.trim().toLowerCase();
    const fromT = from ? new Date(from).getTime() : null;
    const toT = to ? new Date(`${to}T23:59:59`).getTime() : null;

    let list: (ExplorerEvent & { distance?: number })[] = events.filter((e) => {
      if (type && e.type !== type) return false;
      if (cityQ && !e.city.toLowerCase().includes(cityQ)) return false;
      if (query) {
        const hay = `${e.title} ${e.description} ${e.city}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      const t = new Date(e.startsAt).getTime();
      if (fromT !== null && t < fromT) return false;
      if (toT !== null && t > toT) return false;
      if (amenities.length && !hasAllAmenities(e.amenities, amenities)) return false;
      return true;
    });

    if (userLocation) {
      list = list.map((e) => ({
        ...e,
        distance: distanceKm(userLocation.lat, userLocation.lng, e.lat, e.lng),
      }));
      if (radius > 0) list = list.filter((e) => (e.distance ?? Infinity) <= radius);
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return list;
  }, [events, q, city, type, from, to, amenities, userLocation, radius]);

  const points: MapPoint[] = useMemo(
    () =>
      filtered.map((e) => ({
        id: e.id,
        slug: e.slug,
        lat: e.lat,
        lng: e.lng,
        title: e.title,
        type: e.type,
        color: eventTypeColor(e.type),
        subtitle: `${e.city} · ${new Date(e.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        href: `/events/${e.slug}`,
        kind: "event" as const,
        amenities: e.amenities,
        imageUrl: e.imageUrl,
      })),
    [filtered],
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem" }} className="events-explorer">
      {/* Sidebar filters */}
      <aside className="card-surface" style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "calc(100vh - 120px)", overflow: "auto", position: "sticky", top: 80 }}>
        <div>
          <label className="field-label">Keyword</label>
          <input className="field-input" placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="field-label">City</label>
          <input className="field-input" placeholder="Any city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ marginBottom: ".4rem" }}>Near me</label>
          <button
            onClick={userLocation ? () => { setUserLocation(null); setFocus(null); } : locateMe}
            disabled={locating}
            className={userLocation ? "btn-ghost" : "btn-or"}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: ".45rem" }}
          >
            <i className={`fas ${locating ? "fa-spinner fa-spin" : userLocation ? "fa-xmark" : "fa-location-crosshairs"}`} />
            {locating ? "Locating…" : userLocation ? "Clear location" : "Use my location"}
          </button>
          {locateError && <p style={{ fontSize: ".72rem", color: "#ff6b5e", marginTop: ".4rem" }}>{locateError}</p>}
          {userLocation && (
            <select className="field-select" style={{ marginTop: ".5rem" }} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
              {RADII.map((r) => (
                <option key={r} value={r}>{r === 0 ? "Any distance" : `Within ${r} km`}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
          <div>
            <label className="field-label">From</label>
            <input type="date" className="field-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="field-label">To</label>
            <input type="date" className="field-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label" style={{ marginBottom: ".4rem" }}>Event type</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
            {EVENT_TYPES.map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(active ? "" : t)}
                  className="tag"
                  style={{
                    borderColor: active ? EVENT_TYPE_COLORS[t] : "var(--bdr2)",
                    color: active ? "#fff" : "var(--mut)",
                    background: active ? EVENT_TYPE_COLORS[t] + "22" : "transparent",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: EVENT_TYPE_COLORS[t], display: "inline-block", marginRight: 5 }} />
                  {EVENT_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button type="button" onClick={() => setShowAmenities((s) => !s)} className="btn-ghost" style={{ width: "100%", textAlign: "left" }} aria-expanded={showAmenities}>
            <i className={`fas ${showAmenities ? "fa-chevron-up" : "fa-sliders"}`} /> Amenities
            {amenities.length > 0 && <span style={{ color: "var(--or)", marginLeft: 6, fontWeight: 700 }}>{amenities.length}</span>}
          </button>
          {showAmenities && (
            <div style={{ marginTop: ".6rem" }}>
              <AmenityFilter value={amenities} onChange={setAmenities} />
            </div>
          )}
        </div>

        <button onClick={clearAll} className="btn-ghost" style={{ width: "100%" }}>
          <i className="fas fa-rotate-left" /> Clear all filters
        </button>
      </aside>

      {/* Main panel */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: ".75rem" }}>
          <span style={{ color: "var(--mut)", fontSize: ".9rem" }}>
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
            {userLocation && radius > 0 ? ` within ${radius} km` : ""}
          </span>
          {/* Prominent Map / List toggle */}
          <div style={{ display: "inline-flex", background: "var(--card2)", border: "1px solid var(--bdr2)", borderRadius: 8, padding: 3 }}>
            <ToggleBtn active={view === "map"} onClick={() => setView("map")} icon="fa-map-location-dot" label="Map" />
            <ToggleBtn active={view === "list"} onClick={() => setView("list")} icon="fa-grip" label="List" />
          </div>
        </div>

        {/* Map view */}
        {view === "map" && (
          <>
            <MapView points={points} height="calc(100vh - 180px)" fitToPoints={!userLocation} focus={focus} userLocation={userLocation} />
            <div style={{ display: "flex", gap: "1.25rem", marginTop: ".75rem", flexWrap: "wrap", fontSize: ".78rem", color: "var(--mut)" }}>
              <span><i className="fas fa-circle-info" /> Click a pin for details</span>
              <span style={{ marginLeft: "auto" }}>{points.length} on map</span>
            </div>
          </>
        )}

        {/* List view */}
        {view === "list" && (
          filtered.length === 0 ? (
            <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
              <i className="fas fa-magnifying-glass" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem" }} />
              No events match your filters. Try widening them.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )
        )}
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .events-explorer {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".4rem",
        padding: ".45rem .95rem",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: ".82rem",
        fontWeight: 700,
        background: active ? "var(--or)" : "transparent",
        color: active ? "#fff" : "var(--mut)",
        transition: "all .15s",
      }}
    >
      <i className={`fas ${icon}`} /> {label}
    </button>
  );
}
