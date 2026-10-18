import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminEventsTable, type AdminEventRow } from "@/components/admin/AdminEventsTable";
import { Pagination } from "@/components/admin/Pagination";
import { eventTypeLabel, EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_STATUSES } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { adminEventWhere } from "@/lib/adminFilters";

export const dynamic = "force-dynamic";

const PER = 50;
type SP = { q?: string; type?: string; status?: string; featured?: string; when?: string; page?: string };

export default async function AdminEvents({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const where = adminEventWhere(sp);
  const page = Math.max(1, Number(sp.page) || 1);

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      include: { organiser: { select: { name: true, email: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  const now = new Date();
  const rows: AdminEventRow[] = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    typeLabel: eventTypeLabel(e.type),
    city: e.city,
    startsAtLabel: formatDate(e.startsAt),
    organiserName: e.organiser.name,
    organiserEmail: e.organiser.email,
    status: e.status,
    featured: e.featured,
    isPast: e.startsAt < now,
  }));

  const filterParams: Record<string, string> = {};
  for (const k of ["q", "type", "status", "featured", "when"] as const) if (sp[k]) filterParams[k] = sp[k]!;
  const hasFilters = Object.keys(filterParams).length > 0;

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

      <AdminEventsTable events={rows} />
      <Pagination basePath="/admin/events" params={filterParams} page={page} total={total} per={PER} />
    </div>
  );
}
