"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { addRecent, parseRecent, RECENT_KEY, type RecentEvent } from "@/lib/recentViews";

function read(): RecentEvent[] {
  try {
    return parseRecent(localStorage.getItem(RECENT_KEY));
  } catch {
    return [];
  }
}

// Records the current event into the viewer's "recently viewed" list. Renders
// nothing — drop it on the event detail page.
export function RecordRecentView({ event }: { event: RecentEvent }) {
  useEffect(() => {
    try {
      const next = addRecent(read(), event);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — nothing to do */
    }
    // Only re-record when the event identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.slug]);
  return null;
}

// A compact "recently viewed" strip (recognition over recall). Renders nothing
// until it has something to show, so it's safe to place on any page.
export function RecentEventsStrip({
  heading = "Recently viewed",
  excludeSlug,
  max = 6,
}: {
  heading?: string;
  excludeSlug?: string;
  max?: number;
}) {
  const [items, setItems] = useState<RecentEvent[]>([]);

  useEffect(() => {
    setItems(read().filter((e) => e.slug !== excludeSlug).slice(0, max));
  }, [excludeSlug, max]);

  if (items.length === 0) return null;

  return (
    <section className="section" style={{ background: "var(--bg)", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1.1rem" }}>
          <i className="fas fa-clock-rotate-left" style={{ color: "var(--or)" }} />
          <h2 className="hd" style={{ fontSize: "1.4rem" }}>{heading}</h2>
        </div>
        <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: ".5rem" }}>
          {items.map((e) => {
            const color = eventTypeColor(e.type);
            return (
              <Link
                key={e.slug}
                href={`/events/${e.slug}`}
                className="card-surface"
                style={{ flex: "0 0 220px", padding: "0.9rem 1rem", textDecoration: "none", color: "inherit", borderLeft: `3px solid ${color}` }}
              >
                <span className="pill" style={{ background: color, color: "#fff", marginBottom: ".5rem" }}>
                  {eventTypeLabel(e.type)}
                </span>
                <div style={{ fontWeight: 700, fontSize: ".9rem", lineHeight: 1.3, marginBottom: ".35rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {e.title}
                </div>
                <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                  <i className="fas fa-calendar-alt" /> {formatDate(e.startsAt)} · {e.city}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
