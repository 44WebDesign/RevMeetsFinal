import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/AdminUsersTable";
import { Pagination } from "@/components/admin/Pagination";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/enums";
import { formatDate, initials } from "@/lib/utils";
import { adminUserWhere } from "@/lib/adminFilters";

export const dynamic = "force-dynamic";

const PER = 50;
type SP = { q?: string; role?: string; status?: string; page?: string };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const where = adminUserWhere(sp);
  const page = Math.max(1, Number(sp.page) || 1);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      include: {
        _count: { select: { events: true } },
        club: { select: { slug: true } },
        venue: { select: { slug: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roleLabel: ROLE_LABELS[u.role as Role] ?? u.role,
    role: u.role,
    suspended: u.suspended,
    avatarColor: u.avatarColor,
    initials: initials(u.name),
    eventsCount: u._count.events,
    joinedLabel: formatDate(u.createdAt),
    clubSlug: u.club?.slug ?? null,
    venueSlug: u.venue?.slug ?? null,
    isSelf: u.id === me?.id,
    isAdmin: u.role === "ADMIN",
  }));

  const filterParams: Record<string, string> = {};
  for (const k of ["q", "role", "status"] as const) if (sp[k]) filterParams[k] = sp[k]!;
  const qs = new URLSearchParams(filterParams).toString();
  const hasFilters = Object.keys(filterParams).length > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
        <h1 className="hd" style={{ fontSize: "1.9rem", margin: 0 }}>Users ({total})</h1>
        <a href={`/api/admin/users/export${qs ? `?${qs}` : ""}`} className="btn-ghost" style={{ fontSize: ".82rem" }}>
          <i className="fas fa-file-csv" /> Export CSV
        </a>
      </div>

      <form method="get" className="admin-filter-bar">
        <input name="q" defaultValue={sp.q} className="field-input" placeholder="Search name or email…" style={{ flex: "1 1 200px", minWidth: 0 }} />
        <select name="role" defaultValue={sp.role ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r as Role]}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="btn-or" style={{ padding: "0 1rem", whiteSpace: "nowrap" }}><i className="fas fa-search" /> Filter</button>
        {hasFilters && <Link href="/admin/users" className="btn-ghost" style={{ fontSize: ".82rem" }}>Clear</Link>}
      </form>

      <AdminUsersTable users={rows} />
      <Pagination basePath="/admin/users" params={filterParams} page={page} total={total} per={PER} />
    </div>
  );
}
