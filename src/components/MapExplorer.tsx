"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapView, type MapPoint, type MapBounds } from "./MapView";
import { AmenityFilter } from "./AmenityFilter";
import { FallbackCover } from "./FallbackCover";
import { hasAllAmenities } from "@/lib/amenities";
import { distanceKm } from "@/lib/utils";
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, eventTypeLabel } from "@/lib/enums";

type LatLng = { lat: number; lng: number };
type SortKey = "soonest" | "nearest" | "name";
type QuickRange = "weekend" | "week" | "month";
const RADII = [0, 5, 10, 25, 50, 100]; // km; 0 = any distance
const LIST_CAP = 40;

const QUICK_LABELS: Record<QuickRange, string> = {
  weekend: "This weekend",
  week: "This week",
  month: "This month",
};

// Compact map legend (shown under the map).
const LEGEND: [string, string][] = [
  ["Car Show", EVENT_TYPE_COLORS.CAR_SHOW],
  ["Track Day", EVENT_TYPE_COLORS.TRACK_DAY],
  ["Cruise", EVENT_TYPE_COLORS.NIGHT_CRUISE],
  ["Meet", EVENT_TYPE_COLORS.MEET],
  ["Drift", EVENT_TYPE_COLORS.DRIFT_EVENT],
  ["Venue", "#00BCD4"],
];

function prettyAmenity(key: string): string {
  const s = key.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MapExplorer({
  eventPoints,
  venuePoints,
}: {
  eventPoints: MapPoint[];
  venuePoints: MapPoint[];
}) {
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showVenues, setShowVenues] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [sort, setSort] = useState<SortKey>("soonest");
  const [quick, setQuick] = useState<QuickRange | null>(null);
  const [includePast, setIncludePast] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<(LatLng & { zoom?: number }) | null>(null);
  const [radius, setRadius] = useState(25); // km
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  function toggleType(t: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

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

  const dateRange = useMemo<[number, number] | null>(() => {
    if (!quick) return null;
    const now = new Date();
    const dow = now.getDay();
    let f = new Date(now);
    let t = new Date(now);
    if (quick === "weekend") {
      f.setDate(now.getDate() + ((6 - dow + 7) % 7));
      t = new Date(f);
      t.setDate(f.getDate() + 1);
    } else if (quick === "week") {
      t.setDate(now.getDate() + (dow === 0 ? 0 : 7 - dow));
    } else {
      t = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    f.setHours(0, 0, 0, 0);
    t.setHours(23, 59, 59, 999);
    return [f.getTime(), t.getTime()];
  }, [quick]);

  // Filtered + distance-annotated + sorted points (drives the map pins).
  const points = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: (MapPoint & { distance?: number })[] = [];

    if (showEvents) {
      list = list.concat(
        eventPoints.filter((p) => {
          if (!includePast && p.isPast) return false;
          if (activeTypes.size > 0 && !activeTypes.has(p.type)) return false;
          if (dateRange && p.startsAt) {
            const t = Date.parse(p.startsAt);
            if (t < dateRange[0] || t > dateRange[1]) return false;
          }
          return true;
        }),
      );
    }
    if (showVenues) list = list.concat(venuePoints);

    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.subtitle ?? "").toLowerCase().includes(q),
      );
    }
    if (amenities.length) {
      list = list.filter((p) => hasAllAmenities(p.amenities, amenities));
    }
    if (userLocation) {
      list = list.map((p) => ({
        ...p,
        distance: distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }));
      if (radius > 0) list = list.filter((p) => (p.distance ?? Infinity) <= radius);
    }

    const byName = (a: MapPoint, b: MapPoint) => a.title.localeCompare(b.title);
    const byDate = (a: MapPoint, b: MapPoint) => {
      const ta = a.startsAt ? Date.parse(a.startsAt) : Infinity; // venues (no date) last
      const tb = b.startsAt ? Date.parse(b.startsAt) : Infinity;
      return ta !== tb ? ta - tb : byName(a, b);
    };
    const effective: SortKey = sort === "nearest" && !userLocation ? "soonest" : sort;
    list.sort((a, b) => {
      if (effective === "nearest") return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      if (effective === "name") return byName(a, b);
      return byDate(a, b);
    });
    return list;
  }, [query, activeTypes, amenities, showVenues, showEvents, includePast, dateRange, sort, userLocation, radius, eventPoints, venuePoints]);

  // Results list reflects what's inside the current map viewport (updates on
  // pan/zoom), so it reads as "what's on screen".
  const visible = useMemo(() => {
    if (!bounds) return points;
    return points.filter(
      (p) => p.lat <= bounds.north && p.lat >= bounds.south && p.lng <= bounds.east && p.lng >= bounds.west,
    );
  }, [points, bounds]);

  // Active-filter chips.
  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (query) chips.push({ key: "q", label: `“${query}”`, onClear: () => setQuery("") });
  Array.from(activeTypes).forEach((t) =>
    chips.push({ key: `t-${t}`, label: eventTypeLabel(t), onClear: () => toggleType(t) }),
  );
  if (quick) chips.push({ key: "quick", label: QUICK_LABELS[quick], onClear: () => setQuick(null) });
  amenities.forEach((a) =>
    chips.push({ key: `am-${a}`, label: prettyAmenity(a), onClear: () => setAmenities(amenities.filter((x) => x !== a)) }),
  );
  if (userLocation) chips.push({ key: "loc", label: `Near me${radius ? ` · ${radius}km` : ""}`, onClear: clearLocation });
  if (includePast) chips.push({ key: "past", label: "Incl. past", onClear: () => setIncludePast(false) });
  if (!showEvents) chips.push({ key: "noev", label: "Events hidden", onClear: () => setShowEvents(true) });
  if (!showVenues) chips.push({ key: "nove", label: "Venues hidden", onClear: () => setShowVenues(true) });

  function clearAll() {
    setQuery("");
    setActiveTypes(new Set());
    setAmenities([]);
    setQuick(null);
    setIncludePast(false);
    setShowEvents(true);
    setShowVenues(true);
    clearLocation();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }} className="map-explorer">
      {/* Sidebar */}
      <aside className="map-sidebar card-surface">
        <div className="map-sidebar-top">
          <span style={{ fontWeight: 700, fontSize: ".9rem" }}>
            {points.length} result{points.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="map-filters-toggle btn-ghost"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            aria-expanded={mobileFiltersOpen}
          >
            <i className={`fas ${mobileFiltersOpen ? "fa-chevron-up" : "fa-sliders"}`} /> Filters
          </button>
        </div>

        <div className="map-filters-scroll">
          <div className={`map-filters${mobileFiltersOpen ? " open" : ""}`}>
            <div>
              <label className="field-label">Search</label>
              <input className="field-input" placeholder="Event, venue or city..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div>
              <label className="field-label" style={{ marginBottom: ".5rem" }}>Near me</label>
              <button
                onClick={userLocation ? clearLocation : locateMe}
                disabled={locating}
                className={userLocation ? "btn-ghost" : "btn-or"}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: ".45rem" }}
              >
                <i className={`fas ${locating ? "fa-spinner fa-spin" : userLocation ? "fa-xmark" : "fa-location-crosshairs"}`} />
                {locating ? "Locating…" : userLocation ? "Clear my location" : "Use my location"}
              </button>
              {locateError && <p style={{ fontSize: ".72rem", color: "#ff6b5e", marginTop: ".4rem" }}>{locateError}</p>}
              {userLocation && (
                <div style={{ marginTop: ".6rem" }}>
                  <label className="field-label" style={{ marginBottom: ".3rem" }}>Within</label>
                  <select className="field-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                    {RADII.map((r) => (
                      <option key={r} value={r}>{r === 0 ? "Any distance" : `${r} km`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="field-label" style={{ marginBottom: ".3rem" }}>Sort by</label>
              <select className="field-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="soonest">Soonest first</option>
                {userLocation && <option value="nearest">Nearest first</option>}
                <option value="name">Name A–Z</option>
              </select>
            </div>

            <div>
              <label className="field-label" style={{ marginBottom: ".5rem" }}>Show on map</label>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <ToggleChip active={showEvents} onClick={() => setShowEvents((v) => !v)} color="#FF5F1F">
                  <i className="fas fa-flag-checkered" /> Events
                </ToggleChip>
                <ToggleChip active={showVenues} onClick={() => setShowVenues((v) => !v)} color="#00BCD4">
                  <i className="fas fa-warehouse" /> Venues
                </ToggleChip>
              </div>
            </div>

            <div>
              <label className="field-label" style={{ marginBottom: ".5rem" }}>When</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
                {(Object.keys(QUICK_LABELS) as QuickRange[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setQuick((cur) => (cur === k ? null : k))}
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
                  aria-pressed={includePast}
                  style={{
                    borderColor: includePast ? "var(--or)" : "var(--bdr2)",
                    color: includePast ? "#fff" : "var(--mut)",
                    background: includePast ? "rgba(255,95,31,.18)" : "transparent",
                  }}
                >
                  <i className="fas fa-clock-rotate-left" style={{ marginRight: 4 }} /> Past
                </button>
              </div>
            </div>

            <div>
              <label className="field-label" style={{ marginBottom: ".5rem" }}>Event types</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
                {EVENT_TYPES.map((t) => {
                  const active = activeTypes.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
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
              <label className="field-label" style={{ marginBottom: ".5rem" }}>
                Amenities{amenities.length > 0 && <span style={{ color: "var(--or)" }}> · {amenities.length} selected</span>}
              </label>
              <AmenityFilter value={amenities} onChange={setAmenities} />
            </div>
          </div>
        </div>

        {/* Active-filter chips (always visible) */}
        {chips.length > 0 && (
          <div className="map-chips">
            {chips.map((c) => (
              <button key={c.key} onClick={c.onClear} className="tag" style={{ borderColor: "var(--bdr2)", color: "var(--txt)", background: "var(--card2)" }} title="Remove filter">
                {c.label} <i className="fas fa-xmark" style={{ marginLeft: 4, color: "var(--mut)" }} />
              </button>
            ))}
            <button onClick={clearAll} className="btn-ghost" style={{ padding: ".3rem .7rem", fontSize: ".78rem" }}>
              <i className="fas fa-rotate-left" /> Clear
            </button>
          </div>
        )}

        {/* Results list — reflects the current map viewport */}
        <div className="map-results">
          <div className="map-results-head">
            <span style={{ fontWeight: 700, fontSize: ".82rem" }}>
              {visible.length} in view{visible.length > LIST_CAP ? ` · first ${LIST_CAP}` : ""}
            </span>
            <span style={{ fontSize: ".7rem", color: "var(--mut)" }}>
              <i className="fas fa-arrows-up-down-left-right" /> Pan / zoom
            </span>
          </div>
          {visible.length === 0 ? (
            <p style={{ fontSize: ".82rem", color: "var(--mut)", textAlign: "center", padding: "1rem 0" }}>
              Nothing in view{!includePast ? " — try including past events, or zoom out" : " — zoom out or move the map"}.
            </p>
          ) : (
            visible.slice(0, LIST_CAP).map((p) => {
              const label = p.kind === "venue" ? "Venue" : eventTypeLabel(p.type);
              return (
                <div key={`${p.kind}-${p.id}`} className="map-result-row">
                  <button
                    type="button"
                    className="map-result-main"
                    onClick={() => setFocus({ lat: p.lat, lng: p.lng, zoom: 12 })}
                    title="Show on map"
                  >
                    <span className="map-result-thumb">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
                      ) : (
                        <FallbackCover accent={p.color} icon={p.kind === "venue" ? "fa-warehouse" : "fa-calendar-alt"} />
                      )}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="pill" style={{ background: p.color, color: "#fff", fontSize: ".54rem", display: "inline-block", marginBottom: ".2rem" }}>
                        {label}
                      </span>
                      <span style={{ display: "block", fontSize: ".82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.title}
                      </span>
                      <span style={{ display: "block", fontSize: ".72rem", color: "var(--mut)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.subtitle}
                        {p.distance !== undefined ? ` · ${p.distance < 10 ? p.distance.toFixed(1) : Math.round(p.distance)} km` : ""}
                      </span>
                    </span>
                  </button>
                  <Link href={p.href} className="map-result-open" aria-label={`Open ${p.title}`}>
                    <i className="fas fa-arrow-right" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Map + legend */}
      <div className="map-map">
        <MapView
          points={points}
          height="calc(100vh - 190px)"
          fitToPoints={!userLocation}
          focus={focus}
          userLocation={userLocation}
          onBoundsChange={setBounds}
        />
        <div className="map-legend">
          {LEGEND.map(([label, color]) => (
            <span key={label} className="map-legend-item">
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} /> {label}
            </span>
          ))}
          <span className="map-legend-item" style={{ marginLeft: "auto", color: "var(--mut)" }}>
            <i className="fas fa-circle-info" /> Click a pin for details
          </span>
        </div>
      </div>

      <style jsx>{`
        .map-sidebar {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: calc(100vh - 150px);
          overflow: hidden;
        }
        .map-sidebar-top {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .map-filters-scroll {
          flex: 0 1 auto;
          min-height: 0;
          overflow-y: auto;
        }
        .map-filters {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .map-chips {
          flex: 0 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--bdr);
        }
        .map-results {
          flex: 1 1 auto;
          min-height: 140px;
          overflow-y: auto;
          padding-top: 0.75rem;
          border-top: 1px solid var(--bdr);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .map-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          position: sticky;
          top: 0;
          background: var(--card);
          padding-bottom: 0.3rem;
        }
        .map-filters-toggle {
          display: none;
        }
        .map-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem 1rem;
          margin-top: 0.6rem;
          font-size: 0.75rem;
          color: var(--txt);
        }
        .map-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        @media (max-width: 860px) {
          .map-explorer {
            grid-template-columns: 1fr !important;
          }
          .map-sidebar {
            height: auto;
            overflow: visible;
          }
          .map-filters-scroll {
            overflow: visible;
          }
          .map-filters {
            display: none;
          }
          .map-filters.open {
            display: flex;
          }
          .map-results {
            overflow-y: auto;
            max-height: 460px;
          }
          .map-filters-toggle {
            display: inline-flex;
          }
          .map-map {
            order: -1;
          }
        }
      `}</style>
      <style jsx global>{`
        .map-result-row {
          display: flex;
          align-items: stretch;
          border: 1px solid var(--bdr);
          border-radius: 8px;
          overflow: hidden;
        }
        .map-result-row:hover {
          border-color: var(--bdr2);
          background: var(--card2);
        }
        .map-result-main {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex: 1;
          min-width: 0;
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          color: inherit;
        }
        .map-result-thumb {
          position: relative;
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
        }
        .map-result-open {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          flex: 0 0 40px;
          color: var(--mut);
          border-left: 1px solid var(--bdr);
          text-decoration: none;
        }
        .map-result-open:hover {
          color: var(--or);
          background: rgba(255, 95, 31, 0.08);
        }
      `}</style>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="tag"
      style={{
        flex: 1,
        justifyContent: "center",
        borderColor: active ? color : "var(--bdr2)",
        color: active ? "#fff" : "var(--mut)",
        background: active ? color + "22" : "transparent",
      }}
    >
      {children}
    </button>
  );
}
