"use client";

import { useState } from "react";

type Props = {
  title: string;
  description: string;
  location: string;
  start: string; // ISO
  end?: string | null; // ISO
  url: string;
};

// Format an ISO date as an iCalendar UTC timestamp: 20260815T100000Z
function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Google Calendar wants YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ
function gcalDates(start: string, end?: string | null): string {
  const s = icsStamp(start);
  const e = icsStamp(end ?? new Date(new Date(start).getTime() + 2 * 3600_000).toISOString());
  return `${s}/${e}`;
}

export function AddToCalendar(props: Props) {
  const [open, setOpen] = useState(false);

  const endIso = props.end ?? new Date(new Date(props.start).getTime() + 2 * 3600_000).toISOString();

  const googleUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(props.title)}` +
    `&dates=${gcalDates(props.start, props.end)}` +
    `&details=${encodeURIComponent(`${props.description}\n\n${props.url}`)}` +
    `&location=${encodeURIComponent(props.location)}`;

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RevMeet//EN",
      "BEGIN:VEVENT",
      `UID:${icsStamp(props.start)}-${Math.random().toString(36).slice(2)}@revmeet`,
      `DTSTAMP:${icsStamp(new Date().toISOString())}`,
      `DTSTART:${icsStamp(props.start)}`,
      `DTEND:${icsStamp(endIso)}`,
      `SUMMARY:${escapeIcs(props.title)}`,
      `DESCRIPTION:${escapeIcs(`${props.description}\n\n${props.url}`)}`,
      `LOCATION:${escapeIcs(props.location)}`,
      `URL:${props.url}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${props.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".4rem" }}>
        <i className="fas fa-calendar-plus" /> Add to Calendar
      </button>
      {open && (
        <div
          className="card-surface"
          style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, padding: ".4rem", display: "flex", flexDirection: "column", gap: ".25rem" }}
        >
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} style={menuItem}>
            <i className="fab fa-google" style={{ width: 18 }} /> Google Calendar
          </a>
          <button onClick={downloadIcs} style={{ ...menuItem, background: "transparent", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
            <i className="fas fa-download" style={{ width: 18 }} /> Apple / Outlook (.ics)
          </button>
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

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
