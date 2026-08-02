"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/enums";

export function EventFilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [city, setCity] = useState(sp.get("city") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/events?${params.toString()}`);
  }

  function clear() {
    setQ("");
    setCity("");
    setType("");
    setFrom("");
    setTo("");
    router.push("/events");
  }

  return (
    <form
      onSubmit={apply}
      className="card-surface"
      style={{
        padding: "1.25rem",
        display: "grid",
        gap: ".75rem",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
        alignItems: "end",
      }}
    >
      <div>
        <label className="field-label">Keyword</label>
        <input className="field-input" placeholder="Search events..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div>
        <label className="field-label">City</label>
        <input className="field-input" placeholder="Any" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <label className="field-label">Type</label>
        <select className="field-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">From</label>
        <input type="date" className="field-input" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div>
        <label className="field-label">To</label>
        <input type="date" className="field-input" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <button type="submit" className="btn-or" style={{ height: 46, padding: "0 1.1rem" }}>
          <i className="fas fa-search" />
        </button>
        <button type="button" onClick={clear} className="btn-ghost" style={{ height: 46 }}>
          Clear
        </button>
      </div>
      <style jsx>{`
        @media (max-width: 900px) {
          form {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
