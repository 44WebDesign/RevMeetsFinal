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
  imageUrl?: string | null; // cover for the popup tile
};

type Props = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  fitToPoints?: boolean;
  // Fly the map to this location when it changes (e.g. "near me").
  focus?: { lat: number; lng: number; zoom?: number } | null;
  // Renders a "you are here" marker.
  userLocation?: { lat: number; lng: number } | null;
};

export function MapView({
  points,
  center = [53.5, -2.2],
  zoom = 6,
  height = 500,
  fitToPoints = false,
  focus = null,
  userLocation = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const userMarkerRef = useRef<CircleMarker | null>(null);

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

  // Fly to a requested focus point (map is ready by the time a user clicks).
  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.flyTo([focus.lat, focus.lng], focus.zoom ?? 10, { duration: 0.8 });
    }
  }, [focus]);

  // Maintain the "you are here" marker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userLocation) {
        userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          fillColor: "#2196F3",
          color: "#fff",
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        })
          .addTo(mapRef.current)
          .bindPopup("You are here");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userLocation]);

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

      marker.bindPopup(tilePopup(p), { className: "rm-popup", minWidth: 224, maxWidth: 240, closeButton: true });
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

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// A compact version of the list-view tile, rendered inside a Leaflet popup.
function tilePopup(p: MapPoint): string {
  const label = p.kind === "venue" ? "Venue" : p.type.replace(/_/g, " ");
  const icon = p.kind === "venue" ? "fa-warehouse" : "fa-calendar-alt";
  const cover = p.imageUrl
    ? `background-image:linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.35)),url('${encodeURI(p.imageUrl)}');background-size:cover;background-position:center`
    : `background:radial-gradient(circle at 30% 25%, ${hexToRgba(p.color, 0.32)}, transparent 62%), linear-gradient(135deg,#171717,#0c0c0c)`;

  return `
    <div style="width:224px;font-family:Inter,sans-serif">
      <div style="height:104px;position:relative;${cover}">
        <span style="position:absolute;top:8px;left:8px;background:${p.color};color:#fff;font-size:.58rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 9px;border-radius:100px">${escapeHtml(label)}</span>
        ${p.imageUrl ? "" : `<i class="fas ${icon}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.6rem;color:${p.color};opacity:.3"></i>`}
      </div>
      <div style="padding:.7rem .8rem">
        <div style="font-weight:700;font-size:.9rem;line-height:1.25;color:#f5f5f5;margin-bottom:.2rem">${escapeHtml(p.title)}</div>
        ${p.subtitle ? `<div style="font-size:.75rem;color:#9a9a9a;margin-bottom:.65rem"><i class="fas ${icon}" style="margin-right:4px"></i>${escapeHtml(p.subtitle)}</div>` : `<div style="height:.4rem"></div>`}
        <a href="${p.href}" style="display:block;text-align:center;background:${hexToRgba(p.color, 0.14)};border:1px solid ${hexToRgba(p.color, 0.5)};color:${p.color};padding:.45rem;border-radius:6px;font-size:.76rem;font-weight:700;text-decoration:none">
          View ${p.kind === "venue" ? "venue" : "event"} &rarr;
        </a>
      </div>
    </div>`;
}
