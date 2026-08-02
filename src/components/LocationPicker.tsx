"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

// A small map where clicking drops/moves a pin and reports lat/lng back.
export function LocationPicker({
  lat,
  lng,
  onChange,
  height = 260,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { center: [lat, lng], zoom: 6 });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap contributors © CARTO",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:#FF5F1F;border:2px solid #000;transform:rotate(-45deg)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current(round(p.lat), round(p.lng));
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onChangeRef.current(round(e.latlng.lat), round(e.latlng.lng));
      });

      mapRef.current = map;
      markerRef.current = marker;
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

  // Keep marker in sync when lat/lng change from the number inputs.
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height, borderRadius: 8, border: "1px solid var(--bdr)", overflow: "hidden" }}
      />
      <p style={{ fontSize: ".72rem", color: "var(--mut)", marginTop: ".4rem" }}>
        <i className="fas fa-hand-pointer" /> Click or drag the pin to set the exact location.
      </p>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
