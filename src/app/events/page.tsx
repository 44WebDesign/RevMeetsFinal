import { Suspense } from "react";
import Link from "next/link";
import { EventFilterBar } from "@/components/EventFilterBar";
import { EventCard } from "@/components/EventCard";
import { MapView } from "@/components/MapView";
import { getEvents, getEventMapPoints } from "@/lib/queries";
import { eventTypeLabel } from "@/lib/enums";
import { parseAmenityParam } from "@/lib/amenities";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Car Events",
  description:
    "Search the UK's car event calendar — car shows, track days, night cruises, drift events and meets. Filter by location, date and type, or explore on the map.",
  // Filtered variants (?type/?city) canonicalise here to avoid duplicate content.
  alternates: { canonical: "/events" },
};

type SearchParams = Promise<{
  q?: string;
  city?: string;
  type?: string;
  from?: string;
  to?: string;
  amenities?: string;
}>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    city: params.city,
    type: params.type,
    from: params.from,
    to: params.to,
    amenities: parseAmenityParam(params.amenities),
  };

  const [events, points] = await Promise.all([
    getEvents(filters),
    getEventMapPoints(filters),
  ]);

  const activeType = params.type ? eventTypeLabel(params.type) : null;

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div className="sec-label">Browse</div>
        <div className="sec-title">
          {activeType ? `${activeType.toUpperCase()} EVENTS` : "ALL CAR EVENTS"}
        </div>
        <div className="sec-sub" style={{ marginBottom: "1.5rem" }}>
          Search the UK&apos;s car event calendar. Filter by location, date and type — or explore on the map.
        </div>

        <Suspense fallback={<div className="card-surface" style={{ padding: "1.25rem" }}>Loading filters…</div>}>
          <EventFilterBar />
        </Suspense>

        {points.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <MapView points={points} height={340} fitToPoints />
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "2rem 0 1rem",
          }}
        >
          <span style={{ color: "var(--mut)", fontSize: ".9rem" }}>
            {events.length} {events.length === 1 ? "event" : "events"} found
          </span>
          <Link href="/map" className="btn-ghost">
            <i className="fas fa-map" /> Full Map View
          </Link>
        </div>

        {events.length === 0 ? (
          <div
            className="card-surface"
            style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}
          >
            <i className="fas fa-magnifying-glass" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem" }} />
            No events match your search. Try widening your filters.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
              gap: "1.5rem",
            }}
          >
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
