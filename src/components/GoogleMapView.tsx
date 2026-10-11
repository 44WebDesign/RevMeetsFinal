"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { mapTileHtml } from "@/lib/mapTile";
import type { MapViewProps } from "./MapView";

// Real Google Maps implementation (used when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
// set). Mirrors the Leaflet MapView's behaviour: coloured pins per type, the
// mini-tile popup, fit-to-points, focus fly-to and a "you are here" marker.
export function GoogleMapView({
  points,
  center = [53.5, -2.2],
  zoom = 6,
  height = 500,
  fitToPoints = false,
  focus = null,
  userLocation = null,
  bare = false,
  onBoundsChange,
  apiKey,
}: MapViewProps & { apiKey: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  // Load the API + create the map once.
  useEffect(() => {
    let cancelled = false;
    const loader = new Loader({ apiKey, version: "weekly" });

    loader
      .importLibrary("maps")
      .then(({ Map, InfoWindow }) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new Map(containerRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        mapRef.current = map;
        infoRef.current = new InfoWindow();
        // Report the visible bounds after load and on every pan/zoom settle.
        map.addListener("idle", () => {
          const cb = onBoundsChangeRef.current;
          if (!cb) return;
          const gb = map.getBounds();
          if (!gb) return;
          const ne = gb.getNorthEast();
          const sw = gb.getSouthWest();
          cb({ north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() });
        });
        renderMarkers();
      })
      .catch((err) => console.error("[google-maps] failed to load:", err));

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when points change.
  useEffect(() => {
    if (mapRef.current) renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Fly to a focus point (e.g. "near me").
  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.panTo({ lat: focus.lat, lng: focus.lng });
      mapRef.current.setZoom(focus.zoom ?? 10);
    }
  }, [focus]);

  // Maintain the "you are here" marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (userLocation) {
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map,
        title: "You are here",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#2196F3",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
        zIndex: 999,
      });
    }
  }, [userLocation]);

  function renderMarkers() {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => {
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: p.kind === "venue" ? 6.5 : 7.5,
          fillColor: p.color,
          fillOpacity: 0.9,
          strokeColor: "#1a1a1a",
          strokeWeight: 1.5,
        },
      });
      marker.addListener("click", () => {
        const info = infoRef.current;
        if (!info) return;
        info.setContent(mapTileHtml(p));
        info.open({ map, anchor: marker });
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: p.lat, lng: p.lng });
    });

    if (fitToPoints && points.length > 0) {
      map.fitBounds(bounds, 56);
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if ((map.getZoom() ?? 0) > 11) map.setZoom(11);
      });
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
        background: "#e7e4df",
      }}
    />
  );
}
