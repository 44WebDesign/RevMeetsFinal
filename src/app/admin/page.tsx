import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [users, suspended, events, drafts, clubs, venues, registrations, reviews, openReports, promoRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { suspended: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: "DRAFT" } }),
      prisma.club.count(),
      prisma.venue.count(),
      prisma.registration.count(),
      prisma.review.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.promotion.aggregate({ _sum: { amount: true } }),
    ]);

  const revenue = (promoRevenue._sum.amount ?? 0) / 100;

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: "1.25rem" }}>Overview</h1>

      {openReports > 0 && (
        <Link
          href="/admin/reports"
          className="card-surface"
          style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", borderColor: "rgba(244,67,54,.4)", color: "#ff6b5e", textDecoration: "none" }}
        >
          <i className="fas fa-flag" />
          <strong>{openReports}</strong> open report{openReports === 1 ? "" : "s"} need review →
        </Link>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "1rem" }}>
        <Stat label="Users" value={users} sub={suspended ? `${suspended} suspended` : undefined} icon="fa-users" />
        <Stat label="Events" value={events} sub={drafts ? `${drafts} drafts` : undefined} icon="fa-calendar" />
        <Stat label="Clubs" value={clubs} icon="fa-users-gear" />
        <Stat label="Venues" value={venues} icon="fa-warehouse" />
        <Stat label="Registrations" value={registrations} icon="fa-ticket" />
        <Stat label="Reviews" value={reviews} icon="fa-star" />
        <Stat label="Open reports" value={openReports} icon="fa-flag" />
        <Stat label="Promo revenue" value={`£${revenue.toFixed(2)}`} icon="fa-receipt" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: number | string; sub?: string; icon: string }) {
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      <div style={{ color: "var(--or)", fontSize: "1.05rem", marginBottom: ".4rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="hd" style={{ fontSize: "1.9rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{label}</div>
      {sub && <div style={{ fontSize: ".72rem", color: "var(--or)", marginTop: ".2rem" }}>{sub}</div>}
    </div>
  );
}
