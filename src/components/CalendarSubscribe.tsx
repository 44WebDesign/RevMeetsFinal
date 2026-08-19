"use client";

import { useEffect, useRef, useState } from "react";

// "Subscribe" control for a calendar feed. Offers a live subscription (webcal://
// — the calendar app keeps it up to date), a copy-link action, and a one-off
// .ics download. `path` is the feed route, e.g. /api/calendar/club/abc.
export function CalendarSubscribe({
  path,
  label = "Subscribe",
  compact = false,
}: {
  path: string;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const httpUrl = origin ? `${origin}${path}` : path;
  const webcalUrl = origin ? `webcal://${origin.replace(/^https?:\/\//, "")}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
        style={compact ? { fontSize: ".78rem", padding: ".4rem .7rem" } : undefined}
      >
        <i className="fas fa-calendar-plus" /> {label}
      </button>
      {open && (
        <div
          className="card-surface"
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, padding: ".4rem", minWidth: 240, display: "flex", flexDirection: "column", gap: ".2rem" }}
        >
          <a href={webcalUrl} style={menuItem} onClick={() => setOpen(false)}>
            <i className="fas fa-bolt" style={{ width: 18, color: "var(--or)" }} /> Add to calendar (auto-updates)
          </a>
          <a href={httpUrl} target="_blank" rel="noopener noreferrer" style={menuItem} onClick={() => setOpen(false)}>
            <i className="fas fa-download" style={{ width: 18 }} /> Download .ics (one-off)
          </a>
          <button onClick={copy} style={{ ...menuItem, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
            <i className={`fas ${copied ? "fa-check" : "fa-link"}`} style={{ width: 18, color: copied ? "#7fd884" : undefined }} />
            {copied ? "Copied!" : "Copy feed link"}
          </button>
          <p style={{ fontSize: ".7rem", color: "var(--mut)", padding: ".4rem .7rem 0", lineHeight: 1.4 }}>
            “Add to calendar” keeps this list live in Apple Calendar, Google Calendar or Outlook.
          </p>
        </div>
      )}
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: ".5rem",
  padding: ".55rem .7rem",
  borderRadius: 5,
  color: "var(--txt)",
  textDecoration: "none",
  fontSize: ".85rem",
};
