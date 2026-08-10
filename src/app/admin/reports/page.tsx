import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminReportActions } from "@/components/admin/AdminReportActions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#ff6b5e",
  RESOLVED: "#7fd884",
  DISMISSED: "var(--mut)",
};

export default async function AdminReports({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && ["OPEN", "RESOLVED", "DISMISSED"].includes(status) ? status : "OPEN";

  const reports = await prisma.report.findMany({
    where: { status: filter },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: { select: { name: true, email: true } } },
  });

  // Resolve targets in bulk.
  const eventIds = reports.filter((r) => r.targetType === "EVENT").map((r) => r.targetId);
  const reviewIds = reports.filter((r) => r.targetType === "REVIEW").map((r) => r.targetId);
  const [events, reviews] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, slug: true, title: true } }),
    prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: {
        id: true,
        body: true,
        rating: true,
        user: { select: { name: true } },
        event: { select: { slug: true, title: true } },
        club: { select: { slug: true, name: true } },
        venue: { select: { slug: true, name: true } },
      },
    }),
  ]);
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));

  const tabs = ["OPEN", "RESOLVED", "DISMISSED"];

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: "1rem" }}>Reports</h1>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/reports?status=${t}`}
            className="tag"
            style={{ borderColor: filter === t ? "var(--or)" : "var(--bdr2)", color: filter === t ? "#fff" : "var(--mut)", background: filter === t ? "rgba(255,95,31,.15)" : "transparent" }}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
          <i className="fas fa-flag" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem" }} />
          No {filter.toLowerCase()} reports.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {reports.map((r) => {
            const ev = r.targetType === "EVENT" ? eventMap.get(r.targetId) : null;
            const rv = r.targetType === "REVIEW" ? reviewMap.get(r.targetId) : null;
            const exists = !!ev || !!rv;
            return (
              <div key={r.id} className="card-surface" style={{ padding: "1.1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                    <span className="pill" style={{ background: `${STATUS_COLORS[r.status]}22`, color: STATUS_COLORS[r.status] }}>{r.status}</span>
                    <span className="pill" style={{ background: "var(--bdr2)", color: "var(--mut)" }}>{r.targetType}</span>
                    <strong style={{ fontSize: ".9rem" }}>{r.reason}</strong>
                  </div>
                  <span style={{ fontSize: ".74rem", color: "var(--mut)" }}>{formatDateTime(r.createdAt)}</span>
                </div>

                {r.detail && <p style={{ fontSize: ".85rem", color: "rgba(245,245,245,.8)", marginBottom: ".5rem" }}>“{r.detail}”</p>}

                <div style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: ".6rem" }}>
                  Reported by {r.reporter ? `${r.reporter.name} (${r.reporter.email})` : "a deleted user"}.{" "}
                  {ev ? (
                    <>Target: <Link href={`/events/${ev.slug}`} style={{ color: "var(--or)" }}>{ev.title}</Link></>
                  ) : rv ? (
                    <>Target: review by {rv.user.name} ({rv.rating}★) on{" "}
                      {rv.event ? (
                        <Link href={`/events/${rv.event.slug}`} style={{ color: "var(--or)" }}>{rv.event.title}</Link>
                      ) : rv.club ? (
                        <Link href={`/clubs/${rv.club.slug}`} style={{ color: "var(--or)" }}>{rv.club.name}</Link>
                      ) : rv.venue ? (
                        <Link href={`/venues/${rv.venue.slug}`} style={{ color: "var(--or)" }}>{rv.venue.name}</Link>
                      ) : (
                        <span>a deleted item</span>
                      )}
                      {rv.body ? ` — “${rv.body.slice(0, 120)}”` : ""}
                    </>
                  ) : (
                    <span style={{ color: "#ffb347" }}>Target already deleted.</span>
                  )}
                </div>

                <AdminReportActions reportId={r.id} targetType={r.targetType as "EVENT" | "REVIEW"} targetId={r.targetId} targetExists={exists} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
