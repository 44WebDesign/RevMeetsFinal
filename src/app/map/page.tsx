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
    getEventMapPoints({ includePast: true }),
    getVenueMapPoints(),
  ]);

  return (
    <section style={{ padding: "1.5rem 1.25rem 2.5rem" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: ".75rem", flexWrap: "wrap", marginBottom: ".85rem" }}>
          <h1 className="sec-title" style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", margin: 0 }}>
            EXPLORE THE MAP
          </h1>
          <p className="sec-sub" style={{ margin: 0 }}>
            Every upcoming event and venue in one view — filter, toggle layers, and click a pin to dive in.
          </p>
        </div>
        <MapExplorer eventPoints={eventPoints} venuePoints={venuePoints} />
      </div>
    </section>
  );
}
