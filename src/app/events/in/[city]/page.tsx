import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { MapView } from "@/components/MapView";
import { JsonLd } from "@/components/JsonLd";
import { getEvents, getEventMapPoints, getEventCities } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import { citySlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

// "/events/in/london" → "London"
function cityFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const name = cityFromSlug(city);
  const description = `Upcoming car events in ${name} — car shows, meets, cruises and track days. See dates, locations and who's going, and register free on RevMeet.`;
  return {
    title: `Car Events in ${name}`,
    description,
    alternates: { canonical: `/events/in/${city}` },
    openGraph: { title: `Car Events in ${name}`, description, url: absoluteUrl(`/events/in/${city}`) },
  };
}

export default async function CityEventsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const name = cityFromSlug(city);

  const [events, points, cities] = await Promise.all([
    getEvents({ city: name }),
    getEventMapPoints({ city: name }),
    getEventCities(),
  ]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Car events in ${name}`,
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
          / {name}
        </div>
        <h1 className="sec-title">CAR EVENTS IN {name.toUpperCase()}</h1>
        <p className="sec-sub" style={{ marginBottom: "1.5rem" }}>
          Every upcoming car show, meet, cruise and track day in and around {name}.
        </p>

        {points.length > 0 && <MapView points={points} height={320} fitToPoints />}

        <div style={{ margin: "2rem 0 1rem", color: "var(--mut)", fontSize: ".9rem" }}>
          {events.length} upcoming {events.length === 1 ? "event" : "events"} in {name}
        </div>

        {events.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            No upcoming events listed in {name} yet.{" "}
            <Link href="/events" style={{ color: "var(--or)" }}>Browse all events</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.5rem" }}>
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}

        {cities.length > 1 && (
          <div style={{ marginTop: "3rem", borderTop: "1px solid var(--bdr)", paddingTop: "1.5rem" }}>
            <div className="sec-label">Other Cities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
              {cities
                .filter((c) => c.toLowerCase() !== name.toLowerCase())
                .map((c) => (
                  <Link key={c} href={`/events/in/${citySlug(c)}`} className="tag">
                    {c}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
