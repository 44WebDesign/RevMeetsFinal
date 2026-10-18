import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminEventActions } from "@/components/admin/AdminEventActions";
import { eventTypeLabel, EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_STATUSES } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { adminEventWhere } from "@/lib/adminFilters";

export const dynamic = "force-dynamic";

type SP = { q?: string; type?: string; status?: string; featured?: string; when?: string };

export default async function AdminEvents({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const where = adminEventWhere(sp);

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { organiser: { select: { name: true, email: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  const hasFilters = !!(sp.q || sp.type || sp.status || sp.featured || sp.when);

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>Events ({total})</h1>

      <form method="get" className="admin-filter-bar">
        <input name="q" defaultValue={sp.q} className="field-input" placeholder="Search title or city…" style={{ flex: "1 1 180px", minWidth: 0 }} />
        <select name="type" defaultValue={sp.type ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">All types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Any status</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select name="when" defaultValue={sp.when ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Any date</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select name="featured" defaultValue={sp.featured ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Featured &amp; not</option>
          <option value="yes">Featured only</option>
        </select>
        <button className="btn-or" style={{ padding: "0 1rem", whiteSpace: "nowrap" }}><i className="fas fa-search" /> Filter</button>
        {hasFilters && <Link href="/admin/events" className="btn-ghost" style={{ fontSize: ".82rem" }}>Clear</Link>}
      </form>

      <div className="card-surface" style={{ overflow: "hidden" }}>
        {events.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>No events match these filters.</div>
        ) : (
          events.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderTop: i === 0 ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                  <Link href={`/events/${e.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</Link>
                  {e.featured && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,215,0,.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}><i className="fas fa-star" /> Featured</span>}
                  {e.status !== "PUBLISHED" && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>{e.status}</span>}
                  {e.startsAt < new Date() && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(8,8,8,.5)", color: "var(--mut)", border: "1px solid var(--bdr2)" }}>Past</span>}
                </div>
                <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                  {eventTypeLabel(e.type)} · {e.city} · {formatDate(e.startsAt)} · by {e.organiser.name} ({e.organiser.email})
                </div>
              </div>
              <AdminEventActions eventId={e.id} status={e.status} featured={e.featured} />
            </div>
          ))
        )}
      </div>
      {total > events.length && (
        <p style={{ color: "var(--mut)", fontSize: ".78rem", marginTop: "1rem" }}>Showing the first {events.length} of {total}. Narrow the filters to see others.</p>
      )}
    </div>
  );
}
