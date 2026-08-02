"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/enums";

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [type, setType] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("city", location);
    if (from) params.set("from", from);
    if (type) params.set("type", type);
    router.push(`/events?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "rgba(13,13,13,.96)",
        border: "1px solid var(--bdr2)",
        borderRadius: 8,
        padding: "1.25rem",
        maxWidth: 840,
        margin: "0 auto",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr auto",
          gap: ".75rem",
        }}
        className="hero-search-grid"
      >
        <div>
          <label className="field-label">
            <i className="fas fa-location-dot" /> Location
          </label>
          <input
            className="field-input"
            placeholder="City, area..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">
            <i className="fas fa-calendar" /> Date From
          </label>
          <input
            type="date"
            className="field-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">
            <i className="fas fa-car" /> Event Type
          </label>
          <select className="field-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Events</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            type="submit"
            className="btn-or"
            style={{
              padding: "0 1.5rem",
              height: 46,
              fontSize: "1rem",
              width: "100%",
            }}
          >
            <i className="fas fa-search" /> Search
          </button>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 720px) {
          .hero-search-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
