"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapView, type MapPoint } from "./MapView";
import { AmenityFilter } from "./AmenityFilter";
import { hasAllAmenities } from "@/lib/amenities";
import { distanceKm } from "@/lib/utils";
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, eventTypeLabel } from "@/lib/enums";

type LatLng = { lat: number; lng: number };
type SortKey = "soonest" | "nearest" | "name";
type QuickRange = "weekend" | "week" | "month";
const RADII = [0, 5, 10, 25, 50, 100]; // km; 0 = any distance

const QUICK_LABELS: Record<QuickRange, string> = {
  weekend: "This weekend",
  week: "This week",
  month: "This month",
};

function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

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

  // Quick-date range (events only) → [fromMs, toMs].
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

  // Filtered + distance-annotated points.
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

        <div className={`map-filters${mobileFiltersOpen ? " open" : ""}`}>
          <div>
            <label className="field-label">Search</label>
            <input
              className="field-input"
              placeholder="Event, venue or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
            {locateError && (
              <p style={{ fontSize: ".72rem", color: "#ff6b5e", marginTop: ".4rem" }}>{locateError}</p>
            )}
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
              Amenities{amenities.length > 0 && (
                <span style={{ color: "var(--or)" }}> · {amenities.length} selected</span>
              )}
            </label>
            <AmenityFilter value={amenities} onChange={setAmenities} />
          </div>
        </div>

        {/* Active-filter chips (always visible) */}
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", paddingTop: ".75rem", borderTop: "1px solid var(--bdr)" }}>
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
            <button onClick={clearAll} className="btn-ghost" style={{ padding: ".3rem .7rem", fontSize: ".78rem" }}>
              <i className="fas fa-rotate-left" /> Clear
            </button>
          </div>
        )}

        {/* Results list */}
        <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: ".75rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {points.slice(0, 40).map((p) => (
            <Link
              key={`${p.kind}-${p.id}`}
              href={p.href}
              style={{ display: "flex", gap: ".6rem", alignItems: "center", padding: ".5rem", borderRadius: 6, textDecoration: "none", color: "inherit", border: "1px solid var(--bdr)" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: ".82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.title}
                </span>
                <span style={{ display: "block", fontSize: ".72rem", color: "var(--mut)" }}>{p.subtitle}</span>
              </span>
              {p.distance !== undefined && (
                <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--or)", whiteSpace: "nowrap" }}>
                  {p.distance < 10 ? p.distance.toFixed(1) : Math.round(p.distance)} km
                </span>
              )}
            </Link>
          ))}
          {points.length === 0 && (
            <p style={{ fontSize: ".82rem", color: "var(--mut)", textAlign: "center", padding: "1rem 0" }}>
              Nothing matches these filters{!includePast ? " — try including past events" : ""}.
            </p>
          )}
        </div>
      </aside>

      {/* Map */}
      <div>
        <MapView
          points={points}
          height="calc(100vh - 140px)"
          fitToPoints={!userLocation}
          focus={focus}
          userLocation={userLocation}
        />
      </div>

      <style jsx>{`
        .map-sidebar {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: calc(100vh - 140px);
          overflow: auto;
        }
        .map-sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .map-filters-toggle {
          display: none;
        }
        .map-filters {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 860px) {
          .map-explorer {
            grid-template-columns: 1fr !important;
          }
          .map-sidebar {
            max-height: none;
          }
          .map-filters-toggle {
            display: inline-flex;
          }
          .map-filters {
            display: none;
          }
          .map-filters.open {
            display: flex;
          }
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
