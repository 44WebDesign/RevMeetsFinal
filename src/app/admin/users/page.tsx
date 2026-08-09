import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const me = await getCurrentUser();

  const users = await prisma.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { events: true } } },
  });

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>Users ({users.length})</h1>
      <form method="get" style={{ display: "flex", gap: ".5rem", maxWidth: 420, marginBottom: "1.5rem" }}>
        <input name="q" defaultValue={q} className="field-input" placeholder="Search by name or email…" />
        <button className="btn-or" style={{ padding: "0 1rem" }}><i className="fas fa-search" /></button>
      </form>

      <div className="card-surface" style={{ overflow: "hidden" }}>
        {users.map((u, i) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderTop: i === 0 ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".7rem", minWidth: 220 }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: u.avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".72rem", flexShrink: 0 }}>
                {initials(u.name)}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                  {u.name}
                  {u.suspended && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(244,67,54,.2)", color: "#ff6b5e" }}>Suspended</span>}
                  {u.id === me?.id && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>You</span>}
                </div>
                <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                  {u.email} · {ROLE_LABELS[u.role as Role] ?? u.role} · {u._count.events} events · joined {formatDate(u.createdAt)}
                </div>
              </div>
            </div>
            <AdminUserActions userId={u.id} role={u.role} suspended={u.suspended} isSelf={u.id === me?.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
