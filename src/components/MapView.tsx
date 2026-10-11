"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import { mapTileHtml } from "@/lib/mapTile";
import { GoogleMapView } from "./GoogleMapView";

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

// Visible map viewport, in lat/lng degrees.
export type MapBounds = { north: number; south: number; east: number; west: number };

export type MapViewProps = {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  fitToPoints?: boolean;
  // Fly the map to this location when it changes (e.g. "near me").
  focus?: { lat: number; lng: number; zoom?: number } | null;
  // Renders a "you are here" marker.
  userLocation?: { lat: number; lng: number } | null;
  // Full-bleed (no border/radius) — for the full-screen map hero.
  bare?: boolean;
  // Fires with the visible bounds after the map loads and on every pan/zoom.
  onBoundsChange?: (bounds: MapBounds) => void;
};

// Use real Google Maps when an API key is configured; otherwise fall back to
// the free Leaflet + CARTO Voyager basemap (so the site works with no key).
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function MapView(props: MapViewProps) {
  if (GOOGLE_KEY) return <GoogleMapView {...props} apiKey={GOOGLE_KEY} />;
  return <LeafletMapView {...props} />;
}

function LeafletMapView({
  points,
  center = [53.5, -2.2],
  zoom = 6,
  height = 500,
  fitToPoints = false,
  focus = null,
  userLocation = null,
  bare = false,
  onBoundsChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const userMarkerRef = useRef<CircleMarker | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

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
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap contributors © CARTO",
          maxZoom: 19,
        },
      ).addTo(map);

      // Enable scroll zoom only after the user interacts (nicer page scrolling).
      map.on("click", () => map.scrollWheelZoom.enable());

      // Report the visible bounds on every pan/zoom (for a "what's on screen" list).
      const emitBounds = () => {
        const cb = onBoundsChangeRef.current;
        if (!cb) return;
        const b = map.getBounds();
        cb({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
      };
      map.on("moveend", emitBounds);

      mapRef.current = map;
      renderMarkers(L, map);
      emitBounds();
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

  function renderMarkers(L: typeof import("leaflet"), map: LeafletMap) {
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

      marker.bindPopup(mapTileHtml(p), { className: "rm-popup", minWidth: 224, maxWidth: 240, closeButton: true });
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
        borderRadius: bare ? 0 : 8,
        border: bare ? "none" : "1px solid var(--bdr)",
        overflow: "hidden",
        zIndex: 0,
      }}
    />
  );
}
