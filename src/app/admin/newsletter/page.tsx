import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Admin view of the anonymous "events near you" newsletter list.
export default async function AdminNewsletter() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [total, withArea, emailed, thisWeek, subs] = await Promise.all([
    prisma.newsletterSignup.count(),
    prisma.newsletterSignup.count({ where: { NOT: { area: null } } }),
    prisma.newsletterSignup.count({ where: { NOT: { lastSentAt: null } } }),
    prisma.newsletterSignup.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.newsletterSignup.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, email: true, area: true, createdAt: true, lastSentAt: true },
    }),
  ]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem", marginBottom: ".5rem" }}>
        <h1 className="hd" style={{ fontSize: "1.9rem", margin: 0 }}>Newsletter</h1>
        {total > 0 && (
          <a href="/api/admin/newsletter/export" className="btn-ghost" style={{ fontSize: ".82rem" }}>
            <i className="fas fa-file-csv" /> Export CSV
          </a>
        )}
      </div>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.5rem" }}>
        Anonymous &ldquo;events near you&rdquo; subscribers from the homepage. They&apos;re emailed
        by the weekly digest (events matched to their area, or soonest UK-wide), with a one-click
        unsubscribe link in every email.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <Stat label="Subscribers" value={total} icon="fa-envelope" />
        <Stat label="Gave an area" value={withArea} icon="fa-location-dot" />
        <Stat label="Emailed at least once" value={emailed} icon="fa-paper-plane" />
        <Stat label="New this week" value={thisWeek} icon="fa-arrow-trend-up" />
      </div>

      {subs.length === 0 ? (
        <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
          <i className="fas fa-envelope-open" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem" }} />
          No newsletter signups yet.
        </div>
      ) : (
        <div className="card-surface" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", gap: "1rem", padding: ".75rem 1.25rem", borderBottom: "1px solid var(--bdr)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--mut)", fontWeight: 700 }}>
            <span style={{ flex: "2 1 200px", minWidth: 0 }}>Email</span>
            <span style={{ flex: "1 1 120px", minWidth: 0 }}>Area</span>
            <span style={{ flex: "0 0 110px" }}>Joined</span>
            <span style={{ flex: "0 0 110px" }}>Last emailed</span>
          </div>
          {subs.map((s) => (
            <div key={s.id} style={{ display: "flex", gap: "1rem", padding: ".7rem 1.25rem", borderTop: "1px solid var(--bdr)", fontSize: ".82rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: "2 1 200px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</span>
              <span style={{ flex: "1 1 120px", minWidth: 0, color: s.area ? "var(--txt)" : "var(--mut)" }}>{s.area || "—"}</span>
              <span style={{ flex: "0 0 110px", color: "var(--mut)" }}>{formatDate(s.createdAt)}</span>
              <span style={{ flex: "0 0 110px", color: "var(--mut)" }}>{s.lastSentAt ? formatDate(s.lastSentAt) : "—"}</span>
            </div>
          ))}
        </div>
      )}
      {total > subs.length && (
        <p style={{ color: "var(--mut)", fontSize: ".78rem", marginTop: "1rem" }}>
          Showing the {subs.length} most recent of {total} subscribers.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      <div style={{ color: "var(--or)", fontSize: "1.05rem", marginBottom: ".4rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="hd" style={{ fontSize: "1.9rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{label}</div>
    </div>
  );
}
