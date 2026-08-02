"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapView, type MapPoint } from "./MapView";
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/enums";

export function MapExplorer({
  eventPoints,
  venuePoints,
}: {
  eventPoints: MapPoint[];
  venuePoints: MapPoint[];
}) {
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [showVenues, setShowVenues] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  function toggleType(t: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const points = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: MapPoint[] = [];
    if (showEvents) {
      list = list.concat(
        eventPoints.filter(
          (p) => activeTypes.size === 0 || activeTypes.has(p.type),
        ),
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
    return list;
  }, [query, activeTypes, showVenues, showEvents, eventPoints, venuePoints]);

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
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: ".82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.title}
                  </span>
                  <span style={{ display: "block", fontSize: ".72rem", color: "var(--mut)" }}>
                    {p.subtitle}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Map */}
      <div>
        <MapView points={points} height="calc(100vh - 140px)" fitToPoints />
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
