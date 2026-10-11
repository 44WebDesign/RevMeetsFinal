"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapView, type MapPoint, type MapBounds } from "./MapView";
import { EventCard } from "./EventCard";
import { AmenityFilter } from "./AmenityFilter";
import { FallbackCover } from "./FallbackCover";
import { hasAllAmenities } from "@/lib/amenities";
import { distanceKm, formatDate } from "@/lib/utils";
import type { ExplorerEvent } from "@/lib/queries";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  eventTypeColor,
  eventTypeLabel,
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

  // Current visible map viewport — drives the "events on screen" list.
  const [bounds, setBounds] = useState<MapBounds | null>(null);

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

  // Events whose pin is inside the current map viewport (map view only).
  const visible = useMemo(() => {
    if (!bounds) return filtered;
    return filtered.filter(
      (e) =>
        e.lat <= bounds.north &&
        e.lat >= bounds.south &&
        e.lng <= bounds.east &&
        e.lng >= bounds.west,
    );
  }, [filtered, bounds]);

  const activeCount =
    (q ? 1 : 0) + (city ? 1 : 0) + (type ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0) +
    amenities.length + (userLocation ? 1 : 0);

  return (
    <div>
      {/* Horizontal filter / search bar */}
      <div className="card-surface" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <label className="field-label">Keyword</label>
            <input className="field-input" placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ flex: "1 1 140px", minWidth: 0 }}>
            <label className="field-label">City</label>
            <input className="field-input" placeholder="Any city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div style={{ flex: "0 1 140px", minWidth: 0 }}>
            <label className="field-label">From</label>
            <input type="date" className="field-input" style={{ minWidth: 0, fontSize: ".8rem", padding: ".55rem .5rem" }} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div style={{ flex: "0 1 140px", minWidth: 0 }}>
            <label className="field-label">To</label>
            <input type="date" className="field-input" style={{ minWidth: 0, fontSize: ".8rem", padding: ".55rem .5rem" }} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <label className="field-label">Near me</label>
            <div style={{ display: "flex", gap: ".4rem" }}>
              <button
                onClick={userLocation ? () => { setUserLocation(null); setFocus(null); } : locateMe}
                disabled={locating}
                className={userLocation ? "btn-ghost" : "btn-or"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".45rem", whiteSpace: "nowrap" }}
              >
                <i className={`fas ${locating ? "fa-spinner fa-spin" : userLocation ? "fa-xmark" : "fa-location-crosshairs"}`} />
                {locating ? "Locating…" : userLocation ? "Clear" : "Use my location"}
              </button>
              {userLocation && (
                <select className="field-select" style={{ width: "auto" }} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  {RADII.map((r) => (
                    <option key={r} value={r}>{r === 0 ? "Any distance" : `${r} km`}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <label className="field-label" style={{ visibility: "hidden" }}>Amenities</label>
            <button type="button" onClick={() => setShowAmenities((s) => !s)} className="btn-ghost" aria-expanded={showAmenities} style={{ whiteSpace: "nowrap" }}>
              <i className={`fas ${showAmenities ? "fa-chevron-up" : "fa-sliders"}`} /> Amenities
              {amenities.length > 0 && <span style={{ color: "var(--or)", marginLeft: 6, fontWeight: 700 }}>{amenities.length}</span>}
            </button>
          </div>

          {/* Map / List toggle, pushed to the right */}
          <div style={{ marginLeft: "auto", display: "inline-flex", background: "var(--card2)", border: "1px solid var(--bdr2)", borderRadius: 8, padding: 3, alignSelf: "flex-end" }}>
            <ToggleBtn active={view === "map"} onClick={() => setView("map")} icon="fa-map-location-dot" label="Map" />
            <ToggleBtn active={view === "list"} onClick={() => setView("list")} icon="fa-grip" label="List" />
          </div>
        </div>

        {/* Event-type pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", marginTop: ".85rem" }}>
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
          {activeCount > 0 && (
            <button onClick={clearAll} className="btn-ghost" style={{ padding: ".3rem .7rem", fontSize: ".78rem", marginLeft: "auto" }}>
              <i className="fas fa-rotate-left" /> Clear all
            </button>
          )}
        </div>

        {/* Amenities panel (expands under the bar) */}
        {showAmenities && (
          <div style={{ marginTop: ".9rem", paddingTop: ".9rem", borderTop: "1px solid var(--bdr)" }}>
            <AmenityFilter value={amenities} onChange={setAmenities} />
          </div>
        )}

        {locateError && <p style={{ fontSize: ".72rem", color: "#ff6b5e", marginTop: ".5rem" }}>{locateError}</p>}
      </div>

      {/* MAP VIEW — visible-events list on the left, map on the right */}
      {view === "map" && (
        <div className="events-map-layout">
          <aside className="events-visible-list card-surface">
            <div className="events-visible-head">
              <span style={{ fontWeight: 700, fontSize: ".9rem" }}>
                {visible.length} {visible.length === 1 ? "event" : "events"} in view
              </span>
              <span style={{ fontSize: ".72rem", color: "var(--mut)" }}>
                <i className="fas fa-arrows-up-down-left-right" /> Pan / zoom the map
              </span>
            </div>
            <div className="events-visible-scroll">
              {visible.length === 0 ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--mut)", fontSize: ".85rem" }}>
                  <i className="fas fa-map-location-dot" style={{ fontSize: "1.3rem", display: "block", marginBottom: ".6rem" }} />
                  No events in this area. Zoom out or move the map.
                </div>
              ) : (
                visible.map((e) => {
                  const color = eventTypeColor(e.type);
                  return (
                    <Link key={e.id} href={`/events/${e.slug}`} className="events-visible-item">
                      <div className="events-visible-thumb">
                        {e.imageUrl ? (
                          <Image src={e.imageUrl} alt={e.title} fill sizes="76px" style={{ objectFit: "cover" }} />
                        ) : (
                          <FallbackCover accent={color} />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="pill" style={{ background: color, color: "#fff", fontSize: ".58rem", marginBottom: ".3rem" }}>
                          {eventTypeLabel(e.type)}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: ".84rem", lineHeight: 1.25, marginBottom: ".2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {e.title}
                        </div>
                        <div style={{ fontSize: ".72rem", color: "var(--mut)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <i className="fas fa-calendar-alt" /> {formatDate(e.startsAt)} · {e.city}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          <div className="events-map-main">
            <MapView
              points={points}
              height="100%"
              fitToPoints={!userLocation}
              focus={focus}
              userLocation={userLocation}
              onBoundsChange={setBounds}
            />
          </div>
        </div>
      )}

      {/* LIST VIEW — card grid */}
      {view === "list" && (
        <>
          <div style={{ color: "var(--mut)", fontSize: ".9rem", marginBottom: "1rem" }}>
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
            {userLocation && radius > 0 ? ` within ${radius} km` : ""}
          </div>
          {filtered.length === 0 ? (
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
          )}
        </>
      )}

      <style jsx>{`
        .events-map-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 1.25rem;
          align-items: start;
        }
        .events-visible-list {
          display: flex;
          flex-direction: column;
          padding: 0;
          height: calc(100vh - 230px);
          min-height: 420px;
          overflow: hidden;
        }
        .events-visible-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--bdr);
          flex: 0 0 auto;
        }
        .events-visible-scroll {
          overflow-y: auto;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
        }
        .events-map-main {
          height: calc(100vh - 230px);
          min-height: 420px;
        }
        @media (max-width: 860px) {
          .events-map-layout {
            grid-template-columns: 1fr;
          }
          .events-map-main {
            height: 60vh;
            min-height: 360px;
            order: -1;
          }
          .events-visible-list {
            height: auto;
            max-height: 420px;
          }
        }
      `}</style>
      <style jsx global>{`
        .events-visible-item {
          display: flex;
          gap: 0.7rem;
          padding: 0.7rem 0.85rem;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px solid var(--bdr);
          transition: background 0.15s;
        }
        .events-visible-item:hover {
          background: var(--card2);
        }
        .events-visible-thumb {
          position: relative;
          flex: 0 0 76px;
          width: 76px;
          height: 76px;
          border-radius: 8px;
          overflow: hidden;
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
