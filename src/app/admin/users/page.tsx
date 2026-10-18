import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/enums";
import { formatDate, initials } from "@/lib/utils";
import { adminUserWhere } from "@/lib/adminFilters";

export const dynamic = "force-dynamic";

type SP = { q?: string; role?: string; status?: string };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const where = adminUserWhere(sp);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { events: true } },
        club: { select: { slug: true } },
        venue: { select: { slug: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
  const qs = params.toString();
  const hasFilters = !!(sp.q || sp.role || sp.status);

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

      <div className="card-surface" style={{ overflow: "hidden" }}>
        {users.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>No users match these filters.</div>
        ) : (
          users.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderTop: i === 0 ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".7rem", minWidth: 220 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: u.avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".72rem", flexShrink: 0 }}>
                  {initials(u.name)}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                    {u.name}
                    {u.role === "ADMIN" && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,95,31,.15)", color: "var(--or)", border: "1px solid rgba(255,95,31,.35)" }}>Admin</span>}
                    {u.suspended && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(244,67,54,.2)", color: "#ff6b5e" }}>Suspended</span>}
                    {u.id === me?.id && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>You</span>}
                  </div>
                  <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                    {u.email} · {ROLE_LABELS[u.role as Role] ?? u.role} · {u._count.events} events · joined {formatDate(u.createdAt)}
                  </div>
                  {(u.club || u.venue) && (
                    <div style={{ fontSize: ".74rem", marginTop: ".2rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                      {u.club && <Link href={`/clubs/${u.club.slug}`} style={{ color: "var(--or)", textDecoration: "none" }}><i className="fas fa-users-gear" /> View club ↗</Link>}
                      {u.venue && <Link href={`/venues/${u.venue.slug}`} style={{ color: "#00BCD4", textDecoration: "none" }}><i className="fas fa-warehouse" /> View venue ↗</Link>}
                    </div>
                  )}
                </div>
              </div>
              <AdminUserActions userId={u.id} role={u.role} suspended={u.suspended} isSelf={u.id === me?.id} />
            </div>
          ))
        )}
      </div>
      {total > users.length && (
        <p style={{ color: "var(--mut)", fontSize: ".78rem", marginTop: "1rem" }}>Showing the first {users.length} of {total}. Narrow the filters to see others.</p>
      )}
    </div>
  );
}
