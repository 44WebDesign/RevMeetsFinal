import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { MapView } from "@/components/MapView";
import { JsonLd } from "@/components/JsonLd";
import { getEvents, getEventMapPoints } from "@/lib/queries";
import {
  EVENT_TYPES,
  EVENT_TYPE_SLUGS,
  EVENT_TYPE_LABELS,
  eventTypeFromSlug,
  type EventType,
} from "@/lib/enums";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// SEO landing copy per category — unique text helps these pages rank for
// "<category> near me / UK" searches.
const CATEGORY_COPY: Record<EventType, { heading: string; intro: string }> = {
  CAR_SHOW: {
    heading: "CAR SHOWS",
    intro:
      "From concours classics to modified showcases — find car shows across the UK, see who's going, and register in one tap.",
  },
  TRACK_DAY: {
    heading: "TRACK DAYS",
    intro:
      "Open-pitlane sessions, novice-friendly instruction days and timed sprints at circuits across the UK. Find a track day near you.",
  },
  NIGHT_CRUISE: {
    heading: "NIGHT CRUISES",
    intro:
      "City-wide night cruises and coastal runs. Find organised cruises near you, with meeting points, routes and times.",
  },
  DRIFT_EVENT: {
    heading: "DRIFT EVENTS",
    intro:
      "Practice days, competition rounds and drift demos. Whether you're sliding or spectating, find UK drift events here.",
  },
  STANCE_MEET: {
    heading: "STANCE MEETS",
    intro:
      "Static or bagged, tucked or poked — find the UK's stance and fitment meets, judged shows and low-life gatherings.",
  },
  JDM_MEET: {
    heading: "JDM MEETS",
    intro:
      "Skylines, Supras, Evos and rotaries. Find Japanese car meets and JDM showcases happening near you.",
  },
  CLASSIC_CARS: {
    heading: "CLASSIC CAR EVENTS",
    intro:
      "Vintage gatherings, concours judging and heritage rallies. Discover classic car events across the UK.",
  },
  SUPERCAR_MEET: {
    heading: "SUPERCAR MEETS",
    intro:
      "Exotics, hypercars and dream garages in the metal. Find supercar meets and shows near you.",
  },
  MEET: {
    heading: "CAR MEETS",
    intro:
      "Weekly car park meets, club nights and community gatherings — the grassroots of UK car culture, all in one place.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeSlug: string }>;
}): Promise<Metadata> {
  const { typeSlug } = await params;
  const type = eventTypeFromSlug(typeSlug);
  if (!type) return { title: "Not found" };
  const label = EVENT_TYPE_LABELS[type];
  return {
    title: `${label}s in the UK — Upcoming Events`,
    description: CATEGORY_COPY[type].intro,
    alternates: { canonical: `/events/type/${typeSlug}` },
    openGraph: {
      title: `${label}s in the UK`,
      description: CATEGORY_COPY[type].intro,
      url: absoluteUrl(`/events/type/${typeSlug}`),
    },
  };
}

export default async function EventTypePage({
  params,
}: {
  params: Promise<{ typeSlug: string }>;
}) {
  const { typeSlug } = await params;
  const type = eventTypeFromSlug(typeSlug);
  if (!type) notFound();

  const [events, points] = await Promise.all([
    getEvents({ type }),
    getEventMapPoints({ type }),
  ]);

  const copy = CATEGORY_COPY[type];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${EVENT_TYPE_LABELS[type]}s in the UK`,
    numberOfItems: events.length,
    itemListElement: events.slice(0, 25).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/events/${e.slug}`),
      name: e.title,
    })),
  };

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <JsonLd data={itemListLd} />
      <div className="container">
        <div className="sec-label">
          <Link href="/events" style={{ color: "var(--or)", textDecoration: "none" }}>
            Events
          </Link>{" "}
          / {EVENT_TYPE_LABELS[type]}s
        </div>
        <h1 className="sec-title">{copy.heading}</h1>
        <p className="sec-sub" style={{ marginBottom: "1.5rem" }}>{copy.intro}</p>

        {points.length > 0 && <MapView points={points} height={320} fitToPoints />}

        <div style={{ margin: "2rem 0 1rem", color: "var(--mut)", fontSize: ".9rem" }}>
          {events.length} upcoming {events.length === 1 ? "event" : "events"}
        </div>

        {events.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            No upcoming events in this category yet.{" "}
            <Link href="/events" style={{ color: "var(--or)" }}>Browse all events</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.5rem" }}>
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}

        {/* Cross-links to sibling categories — good for crawling and users */}
        <div style={{ marginTop: "3rem", borderTop: "1px solid var(--bdr)", paddingTop: "1.5rem" }}>
          <div className="sec-label">More Categories</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {EVENT_TYPES.filter((t) => t !== type).map((t) => (
              <Link key={t} href={`/events/type/${EVENT_TYPE_SLUGS[t]}`} className="tag">
                {EVENT_TYPE_LABELS[t]}s
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
