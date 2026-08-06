"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapView, type MapPoint } from "./MapView";
import { AmenityFilter } from "./AmenityFilter";
import { hasAllAmenities } from "@/lib/amenities";
import { distanceKm } from "@/lib/utils";
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/enums";

type LatLng = { lat: number; lng: number };
const RADII = [0, 5, 10, 25, 50, 100]; // km; 0 = any distance

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
  }

  // Filtered + distance-annotated points. When a location is set, sort nearest
  // first and (if a radius is chosen) drop anything outside it.
  const points = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: (MapPoint & { distance?: number })[] = [];
    if (showEvents) {
      list = list.concat(
        eventPoints.filter((p) => activeTypes.size === 0 || activeTypes.has(p.type)),
      );
    }
    if (showVenues) list = list.concat(venuePoints);
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.subtitle ?? "").toLowerCase().includes(q),
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
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return list;
  }, [query, activeTypes, amenities, showVenues, showEvents, userLocation, radius, eventPoints, venuePoints]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }} className="map-explorer">
      {/* Sidebar */}
      <aside className="card-surface" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "calc(100vh - 140px)", overflow: "auto" }}>
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
              <select
                className="field-select"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                {RADII.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Any distance" : `${r} km`}
                  </option>
                ))}
              </select>
            </div>
          )}
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

        <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: ".75rem" }}>
          <div style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: ".5rem" }}>
            {points.length} result{points.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {points.slice(0, 40).map((p) => (
              <Link
                key={`${p.kind}-${p.id}`}
                href={p.href}
                style={{
                  display: "flex",
                  gap: ".6rem",
                  alignItems: "center",
                  padding: ".5rem",
                  borderRadius: 6,
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid var(--bdr)",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: ".82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.title}
                  </span>
                  <span style={{ display: "block", fontSize: ".72rem", color: "var(--mut)" }}>
                    {p.subtitle}
                  </span>
                </span>
                {p.distance !== undefined && (
                  <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--or)", whiteSpace: "nowrap" }}>
                    {p.distance < 10 ? p.distance.toFixed(1) : Math.round(p.distance)} km
                  </span>
                )}
              </Link>
            ))}
          </div>
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
        @media (max-width: 860px) {
          .map-explorer {
            grid-template-columns: 1fr !important;
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
