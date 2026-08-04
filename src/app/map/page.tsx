import { MapExplorer } from "@/components/MapExplorer";
import { getEventMapPoints, getVenueMapPoints } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Interactive Map",
  description: "Explore every car event and venue across the UK on one interactive map.",
  alternates: { canonical: "/map" },
};

export default async function MapPage() {
  const [eventPoints, venuePoints] = await Promise.all([
    getEventMapPoints(),
    getVenueMapPoints(),
  ]);

  return (
    <section style={{ padding: "1.5rem 1.25rem 2.5rem" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div className="sec-label">Interactive Map</div>
          <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            EXPLORE THE MAP
          </div>
          <p className="sec-sub">
            Every event and venue in one view. Filter by type, toggle venues, and
            click a pin to dive in.
          </p>
        </div>
        <MapExplorer eventPoints={eventPoints} venuePoints={venuePoints} />
      </div>
    </section>
  );
}
