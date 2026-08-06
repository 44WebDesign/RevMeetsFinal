import { EventsExplorer } from "@/components/EventsExplorer";
import { getExplorerEvents } from "@/lib/queries";
import { eventTypeLabel } from "@/lib/enums";
import { parseAmenityParam } from "@/lib/amenities";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Car Events",
  description:
    "Search the UK's car event calendar — car shows, track days, night cruises, drift events and meets. Explore on the interactive map or switch to a list.",
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
  const events = await getExplorerEvents();

  const activeType = params.type ? eventTypeLabel(params.type) : null;

  return (
    <section style={{ padding: "1.5rem 1.25rem 2.5rem", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div className="sec-label">Browse</div>
          <h1 className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            {activeType ? `${activeType.toUpperCase()} EVENTS` : "EXPLORE CAR EVENTS"}
          </h1>
          <p className="sec-sub">
            Discover events on the interactive map, or switch to a list. Filter by
            location, date, type, amenities — or find what&apos;s near you.
          </p>
        </div>

        <EventsExplorer
          events={events}
          initial={{
            q: params.q,
            city: params.city,
            type: params.type,
            from: params.from,
            to: params.to,
            amenities: parseAmenityParam(params.amenities),
          }}
        />
      </div>
    </section>
  );
}
