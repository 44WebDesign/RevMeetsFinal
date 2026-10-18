import { prisma } from "@/lib/prisma";
import { Pagination } from "@/components/admin/Pagination";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER = 50;

const ACTION_LABELS: Record<string, string> = {
  USER_UPDATE: "User updated",
  USER_DELETE: "User deleted",
  EVENT_UPDATE: "Event moderated",
  EVENT_DELETE: "Event deleted",
  CLUB_UPDATE: "Club moderated",
  VENUE_UPDATE: "Venue moderated",
  REPORT_UPDATE: "Report actioned",
  REVIEW_DELETE: "Review deleted",
  PHOTO_DELETE: "Photo deleted",
  ANNOUNCE: "Announcement sent",
  EVENT_BULK: "Events (bulk)",
  USER_BULK: "Users (bulk)",
};

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [rows, total] = await Promise.all([
    prisma.adminAudit.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
    prisma.adminAudit.count(),
  ]);

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: ".5rem" }}>Audit log ({total})</h1>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.5rem" }}>
        A record of admin actions — who did what, and when. Newest first.
      </p>

      {rows.length === 0 ? (
        <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
          No admin actions recorded yet.
        </div>
      ) : (
        <div className="card-surface" style={{ overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", padding: ".85rem 1.25rem", borderTop: i === 0 ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 240 }}>
                <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{ACTION_LABELS[r.action] ?? r.action}</span>
                {r.detail && <span style={{ color: "var(--mut)", fontSize: ".82rem" }}> — {r.detail}</span>}
                <div style={{ fontSize: ".74rem", color: "var(--mut)", marginTop: ".15rem" }}>
                  by {r.adminEmail}
                  {r.targetType && <> · {r.targetType.toLowerCase()}{r.targetId ? ` ${r.targetId.slice(0, 8)}…` : ""}</>}
                </div>
              </div>
              <span style={{ fontSize: ".74rem", color: "var(--mut)", whiteSpace: "nowrap" }}>{formatDateTime(r.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <Pagination basePath="/admin/audit" params={{}} page={page} total={total} per={PER} />
    </div>
  );
}
