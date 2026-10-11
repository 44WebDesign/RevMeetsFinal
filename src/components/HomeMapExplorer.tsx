"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapView, type MapPoint } from "./MapView";
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

// Homepage map section: a full-width interactive map with a floating filter
// panel overlaid on the left. Mirrors the filters/search from the events page
// (/events) but keeps the result on the map only — no list, no page chrome.
export function HomeMapExplorer({ events }: { events: ExplorerEvent[] }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showAmenities, setShowAmenities] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

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

  const activeCount =
    (q ? 1 : 0) + (city ? 1 : 0) + (type ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0) +
    amenities.length + (userLocation ? 1 : 0);

  return (
    <div className="home-map-wrap">
      <MapView points={points} height="100%" bare fitToPoints={!userLocation} focus={focus} userLocation={userLocation} />

      {/* Floating filter / search panel */}
      <div className={`home-map-panel${panelOpen ? "" : " collapsed"}`}>
        <div className="home-map-panel-head">
          <span style={{ fontWeight: 700, fontSize: ".9rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <i className="fas fa-sliders" style={{ color: "var(--or)" }} /> Find events
            {activeCount > 0 && (
              <span style={{ color: "var(--or)", fontSize: ".75rem", fontWeight: 700 }}>{activeCount}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Collapse filters" : "Expand filters"}
            aria-expanded={panelOpen}
            className="home-map-panel-toggle"
          >
            <i className={`fas ${panelOpen ? "fa-chevron-up" : "fa-chevron-down"}`} />
          </button>
        </div>

        {panelOpen && (
          <div className="home-map-panel-body">
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem" }}>
              <span style={{ fontSize: ".78rem", color: "var(--mut)" }}>
                {filtered.length} {filtered.length === 1 ? "event" : "events"}
                {userLocation && radius > 0 ? ` · ${radius}km` : ""}
              </span>
              {activeCount > 0 && (
                <button onClick={clearAll} className="btn-ghost" style={{ padding: ".4rem .7rem", fontSize: ".78rem" }}>
                  <i className="fas fa-rotate-left" /> Clear
                </button>
              )}
            </div>

            <Link href="/events" className="btn-or" style={{ width: "100%", textAlign: "center" }}>
              <i className="fas fa-expand" /> Open full events page
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .home-map-wrap {
          position: relative;
          width: 100%;
          height: 600px;
        }
        .home-map-panel {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 2;
          width: 320px;
          max-width: calc(100% - 2rem);
          max-height: calc(100% - 2rem);
          display: flex;
          flex-direction: column;
          background: rgba(15, 15, 15, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid var(--bdr2);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .home-map-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--bdr);
        }
        .home-map-panel.collapsed .home-map-panel-head {
          border-bottom: none;
        }
        .home-map-panel-toggle {
          background: transparent;
          border: none;
          color: var(--mut);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0.2rem 0.3rem;
        }
        .home-map-panel-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          overflow-y: auto;
        }
        @media (max-width: 720px) {
          .home-map-wrap {
            height: 540px;
          }
          .home-map-panel {
            top: 0.75rem;
            left: 0.75rem;
            right: 0.75rem;
            width: auto;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
