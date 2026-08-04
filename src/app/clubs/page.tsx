import { ClubCard } from "@/components/ClubCard";
import { getClubs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Car Clubs",
  description:
    "Find and follow active UK car clubs organising meets, shows and track days near you.",
  alternates: { canonical: "/clubs" },
};

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clubs = await getClubs(q);

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div className="sec-label">Community</div>
        <div className="sec-title">CAR CLUBS</div>
        <p className="sec-sub" style={{ marginBottom: "1.5rem" }}>
          Find and follow active car clubs organising meets, shows and track days near you.
        </p>

        <form method="get" style={{ display: "flex", gap: ".5rem", maxWidth: 480, marginBottom: "2rem" }}>
          <input name="q" defaultValue={q} className="field-input" placeholder="Search clubs by name or area..." />
          <button className="btn-or" style={{ padding: "0 1.25rem" }}>
            <i className="fas fa-search" />
          </button>
        </form>

        {clubs.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            No clubs found.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1.5rem" }}>
            {clubs.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
