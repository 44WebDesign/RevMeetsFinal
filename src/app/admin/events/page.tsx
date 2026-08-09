import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminEventActions } from "@/components/admin/AdminEventActions";
import { eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminEvents({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const events = await prisma.event.findMany({
    where: q
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { organiser: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>Events ({events.length})</h1>
      <form method="get" style={{ display: "flex", gap: ".5rem", maxWidth: 420, marginBottom: "1.5rem" }}>
        <input name="q" defaultValue={q} className="field-input" placeholder="Search by title or city…" />
        <button className="btn-or" style={{ padding: "0 1rem" }}><i className="fas fa-search" /></button>
      </form>

      <div className="card-surface" style={{ overflow: "hidden" }}>
        {events.map((e, i) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderTop: i === 0 ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                <Link href={`/events/${e.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</Link>
                {e.featured && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,215,0,.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}><i className="fas fa-star" /> Featured</span>}
                {e.status !== "PUBLISHED" && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>{e.status}</span>}
              </div>
              <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                {eventTypeLabel(e.type)} · {e.city} · {formatDate(e.startsAt)} · by {e.organiser.name} ({e.organiser.email})
              </div>
            </div>
            <AdminEventActions eventId={e.id} status={e.status} featured={e.featured} />
          </div>
        ))}
      </div>
    </div>
  );
}
