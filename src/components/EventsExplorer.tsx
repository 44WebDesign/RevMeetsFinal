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
type SortKey = "soonest" | "nearest" | "newest" | "featured";
type QuickRange = "weekend" | "week" | "month";
const RADII = [0, 5, 10, 25, 50, 100];

export type ExplorerInitial = {
  q?: string;
  city?: string;
  type?: string;
  from?: string;
  to?: string;
  amenities?: string[];
};

function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const QUICK_LABELS: Record<QuickRange, string> = {
  weekend: "This weekend",
  week: "This week",
  month: "This month",
};

function prettyAmenity(key: string): string {
  const s = key.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
  const [quick, setQuick] = useState<QuickRange | null>(null);
  const [amenities, setAmenities] = useState<string[]>(initial.amenities ?? []);
  const [showAmenities, setShowAmenities] = useState((initial.amenities ?? []).length > 0);
  const [sort, setSort] = useState<SortKey>("soonest");
  const [includePast, setIncludePast] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<(LatLng & { zoom?: number }) | null>(null);
  const [radius, setRadius] = useState(25);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

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
        setSort("nearest");
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

  function clearLocation() {
    setUserLocation(null);
    setFocus(null);
    if (sort === "nearest") setSort("soonest");
  }

  function clearDates() {
    setFrom("");
    setTo("");
    setQuick(null);
  }

  function applyQuick(kind: QuickRange) {
    if (quick === kind) {
      clearDates();
      return;
    }
    const now = new Date();
    const dow = now.getDay(); // 0 Sun … 6 Sat
    let f = new Date(now);
    let t = new Date(now);
    if (kind === "weekend") {
      f.setDate(now.getDate() + ((6 - dow + 7) % 7)); // upcoming Saturday
      t = new Date(f);
      t.setDate(f.getDate() + 1); // Sunday
    } else if (kind === "week") {
      t.setDate(now.getDate() + (dow === 0 ? 0 : 7 - dow)); // end of this week (Sun)
    } else {
      t = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month
    }
    setFrom(ymd(f));
    setTo(ymd(t));
    setQuick(kind);
  }

  function clearAll() {
    setQ("");
    setCity("");
    setType("");
    clearDates();
    setAmenities([]);
    setIncludePast(false);
    clearLocation();
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cityQ = city.trim().toLowerCase();
    const fromT = from ? new Date(from).getTime() : null;
    const toT = to ? new Date(`${to}T23:59:59`).getTime() : null;

    let list: (ExplorerEvent & { distance?: number })[] = events.filter((e) => {
      if (!includePast && e.isPast) return false;
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
    }

    const effective: SortKey = sort === "nearest" && !userLocation ? "soonest" : sort;
    const byDate = (a: ExplorerEvent, b: ExplorerEvent) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return [...list].sort((a, b) => {
      if (effective === "nearest") return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      if (effective === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (effective === "featured") {
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        return byDate(a, b);
      }
      return byDate(a, b);
    });
  }, [events, q, city, type, from, to, amenities, includePast, userLocation, radius, sort]);

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

  // Active-filter chips (always visible so people can see/undo each one).
  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (q) chips.push({ key: "q", label: `“${q}”`, onClear: () => setQ("") });
  if (city) chips.push({ key: "city", label: `City: ${city}`, onClear: () => setCity("") });
  if (type) chips.push({ key: "type", label: eventTypeLabel(type), onClear: () => setType("") });
  if (from || to) {
    chips.push({
      key: "dates",
      label: quick ? QUICK_LABELS[quick] : `${from || "…"} → ${to || "…"}`,
      onClear: clearDates,
    });
  }
  amenities.forEach((a) =>
    chips.push({ key: `am-${a}`, label: prettyAmenity(a), onClear: () => setAmenities(amenities.filter((x) => x !== a)) }),
  );
  if (userLocation) chips.push({ key: "loc", label: `Near me${radius ? ` · ${radius}km` : ""}`, onClear: clearLocation });
  if (includePast) chips.push({ key: "past", label: "Incl. past", onClear: () => setIncludePast(false) });

  const activeCount = chips.length;

  return (
    <div>
      {/* Filter / search bar */}
      <div className="card-surface" style={{ padding: "1rem", marginBottom: "1.25rem" }}>
        {/* Top row: count + sort + view toggle (+ Filters button on mobile) */}
        <div className="ee-top">
          <button
            type="button"
            className="ee-filters-toggle btn-ghost"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            aria-expanded={mobileFiltersOpen}
          >
            <i className={`fas ${mobileFiltersOpen ? "fa-chevron-up" : "fa-sliders"}`} /> Filters
            {activeCount > 0 && <span style={{ color: "var(--or)", marginLeft: 6, fontWeight: 700 }}>{activeCount}</span>}
          </button>

          <span style={{ fontSize: ".9rem", color: "var(--mut)" }}>
            <strong style={{ color: "var(--txt)" }}>{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "event" : "events"}
            {userLocation && radius > 0 ? ` within ${radius} km` : ""}
          </span>

          <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            <select
              className="field-select"
              style={{ width: "auto", fontSize: ".82rem", padding: ".45rem 1.6rem .45rem .6rem" }}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort events"
            >
              <option value="soonest">Soonest first</option>
              {userLocation && <option value="nearest">Nearest first</option>}
              <option value="newest">Recently added</option>
              <option value="featured">Featured first</option>
            </select>
            <div style={{ display: "inline-flex", background: "var(--card2)", border: "1px solid var(--bdr2)", borderRadius: 8, padding: 3 }}>
              <ToggleBtn active={view === "map"} onClick={() => setView("map")} icon="fa-map-location-dot" label="Map" />
              <ToggleBtn active={view === "list"} onClick={() => setView("list")} icon="fa-grip" label="List" />
            </div>
          </div>
        </div>

        {/* Collapsible filter body */}
        <div className={`ee-body${mobileFiltersOpen ? " open" : ""}`}>
          <div className="ee-fields">
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
              <input type="date" className="field-input" style={{ minWidth: 0, fontSize: ".8rem", padding: ".55rem .5rem" }} value={from} onChange={(e) => { setFrom(e.target.value); setQuick(null); }} />
            </div>
            <div style={{ flex: "0 1 140px", minWidth: 0 }}>
              <label className="field-label">To</label>
              <input type="date" className="field-input" style={{ minWidth: 0, fontSize: ".8rem", padding: ".55rem .5rem" }} value={to} onChange={(e) => { setTo(e.target.value); setQuick(null); }} />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <label className="field-label">Near me</label>
              <div style={{ display: "flex", gap: ".4rem" }}>
                <button
                  onClick={userLocation ? clearLocation : locateMe}
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
          </div>

          {/* Quick date chips + include-past toggle */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", marginTop: ".85rem", alignItems: "center" }}>
            <span style={{ fontSize: ".75rem", color: "var(--mut)", marginRight: ".2rem" }}>Quick dates:</span>
            {(Object.keys(QUICK_LABELS) as QuickRange[]).map((k) => (
              <button
                key={k}
                onClick={() => applyQuick(k)}
                className="tag"
                style={{
                  borderColor: quick === k ? "var(--or)" : "var(--bdr2)",
                  color: quick === k ? "#fff" : "var(--mut)",
                  background: quick === k ? "rgba(255,95,31,.18)" : "transparent",
                }}
              >
                {QUICK_LABELS[k]}
              </button>
            ))}
            <button
              onClick={() => setIncludePast((p) => !p)}
              className="tag"
              style={{
                marginLeft: ".4rem",
                borderColor: includePast ? "var(--or)" : "var(--bdr2)",
                color: includePast ? "#fff" : "var(--mut)",
                background: includePast ? "rgba(255,95,31,.18)" : "transparent",
              }}
              aria-pressed={includePast}
            >
              <i className="fas fa-clock-rotate-left" style={{ marginRight: 4 }} /> Include past events
            </button>
          </div>

          {/* Event-type pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", marginTop: ".6rem" }}>
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

          {showAmenities && (
            <div style={{ marginTop: ".9rem", paddingTop: ".9rem", borderTop: "1px solid var(--bdr)" }}>
              <AmenityFilter value={amenities} onChange={setAmenities} />
            </div>
          )}
        </div>

        {/* Active-filter chips (always visible) */}
        {activeCount > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".9rem", paddingTop: ".9rem", borderTop: "1px solid var(--bdr)", alignItems: "center" }}>
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.onClear}
                className="tag"
                style={{ borderColor: "var(--bdr2)", color: "var(--txt)", background: "var(--card2)" }}
                title="Remove filter"
              >
                {c.label} <i className="fas fa-xmark" style={{ marginLeft: 4, color: "var(--mut)" }} />
              </button>
            ))}
            <button onClick={clearAll} className="btn-ghost" style={{ padding: ".3rem .7rem", fontSize: ".78rem", marginLeft: ".2rem" }}>
              <i className="fas fa-rotate-left" /> Clear all
            </button>
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
                        <div style={{ fontSize: ".7rem", color: "var(--mut)", marginTop: ".15rem" }}>
                          <i className="fas fa-users" style={{ color: "var(--or)" }} /> {e.attendees} going
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
        filtered.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            <i className="fas fa-magnifying-glass" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem" }} />
            No events match your filters. Try widening them{!includePast ? " or including past events" : ""}.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )
      )}

      <style jsx>{`
        .ee-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .ee-filters-toggle {
          display: none;
        }
        .ee-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-end;
          margin-top: 0.9rem;
        }
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
        @media (max-width: 760px) {
          .ee-filters-toggle {
            display: inline-flex;
          }
          .ee-body {
            display: none;
          }
          .ee-body.open {
            display: block;
          }
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
