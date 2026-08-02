import { VenueCard } from "@/components/VenueCard";
import { getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Venues — RevMeet" };

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const venues = await getVenues(q);

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div className="sec-label">Locations</div>
        <div className="sec-title">VENUES</div>
        <p className="sec-sub" style={{ marginBottom: "1.5rem" }}>
          Spaces offering themselves up for car meets, shows and track days. Perfect if you&apos;re an organiser hunting for a location.
        </p>

        <form method="get" style={{ display: "flex", gap: ".5rem", maxWidth: 480, marginBottom: "2rem" }}>
          <input name="q" defaultValue={q} className="field-input" placeholder="Search venues by name or city..." />
          <button className="btn-or" style={{ padding: "0 1.25rem" }}>
            <i className="fas fa-search" />
          </button>
        </form>

        {venues.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            No venues found.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1.5rem" }}>
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
