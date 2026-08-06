"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";

export type MapPoint = {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  title: string;
  type: string; // event type or "VENUE"
  color: string;
  subtitle?: string;
  href: string;
  kind: "event" | "venue";
  amenities?: string; // comma-separated amenity keys (for filtering)
};

type Props = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  fitToPoints?: boolean;
};

export function MapView({
  points,
  center = [53.5, -2.2],
  zoom = 6,
  height = 500,
  fitToPoints = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap contributors © CARTO",
          maxZoom: 19,
        },
      ).addTo(map);

      // Enable scroll zoom only after the user interacts (nicer page scrolling).
      map.on("click", () => map.scrollWheelZoom.enable());

      mapRef.current = map;
      renderMarkers(L, map);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when points change.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;
      renderMarkers(L, mapRef.current);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  function renderMarkers(
    L: typeof import("leaflet"),
    map: LeafletMap,
  ) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    points.forEach((p) => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: p.kind === "venue" ? 9 : 10,
        fillColor: p.color,
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map);

      const popup = `
        <div style="font-family:Inter,sans-serif;min-width:200px">
          <div style="background:${p.color};color:#fff;padding:.4rem .75rem;margin:-13px -20px .6rem -13px;border-radius:6px 6px 0 0;font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase">
            ${p.kind === "venue" ? "Venue" : p.type.replace(/_/g, " ")}
          </div>
          <strong style="font-size:.92rem;color:#f5f5f5">${escapeHtml(p.title)}</strong>
          ${p.subtitle ? `<div style="font-size:.78rem;color:#9a9a9a;margin-top:.25rem">${escapeHtml(p.subtitle)}</div>` : ""}
          <a href="${p.href}" style="display:inline-block;margin-top:.7rem;background:${p.color};color:#fff;padding:.35rem .9rem;border-radius:4px;font-size:.72rem;font-weight:700;text-decoration:none">
            ${p.kind === "venue" ? "View Venue" : "View Event"}
          </a>
        </div>`;

      marker.bindPopup(popup);
      markersRef.current.push(marker);
    });

    if (fitToPoints && points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds.pad(0.2), { maxZoom: 11 });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        borderRadius: 8,
        border: "1px solid var(--bdr)",
        overflow: "hidden",
        zIndex: 0,
      }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
