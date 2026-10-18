import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [users, suspended, events, drafts, clubs, venues, registrations, reviews, openReports, promoRevenue, newsletter, newsletterWeek, newMessages] =
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
      prisma.newsletterSignup.count(),
      prisma.newsletterSignup.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.contactMessage.count({ where: { repliedAt: null } }),
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

      {newMessages > 0 && (
        <Link
          href="/admin/messages?status=new"
          className="card-surface"
          style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", borderColor: "rgba(255,95,31,.4)", color: "var(--or)", textDecoration: "none" }}
        >
          <i className="fas fa-inbox" />
          <strong>{newMessages}</strong> new message{newMessages === 1 ? "" : "s"} to reply to →
        </Link>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "1rem" }}>
        <Stat label="Users" value={users} sub={suspended ? `${suspended} suspended` : undefined} icon="fa-users" href="/admin/users" subHref={suspended ? "/admin/users?status=suspended" : undefined} />
        <Stat label="Events" value={events} sub={drafts ? `${drafts} drafts` : undefined} icon="fa-calendar" href="/admin/events" subHref={drafts ? "/admin/events?status=DRAFT" : undefined} />
        <Stat label="Clubs" value={clubs} icon="fa-users-gear" href="/admin/listings?kind=clubs" />
        <Stat label="Venues" value={venues} icon="fa-warehouse" href="/admin/listings?kind=venues" />
        <Stat label="Registrations" value={registrations} icon="fa-ticket" />
        <Stat label="Reviews" value={reviews} icon="fa-star" />
        <Stat label="Open reports" value={openReports} icon="fa-flag" href="/admin/reports" />
        <Stat label="New messages" value={newMessages} icon="fa-inbox" href="/admin/messages?status=new" />
        <Stat label="Promo revenue" value={`£${revenue.toFixed(2)}`} icon="fa-receipt" />
        <Stat label="Newsletter" value={newsletter} sub={newsletterWeek ? `+${newsletterWeek} this week` : undefined} icon="fa-envelope" href="/admin/newsletter" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon, href, subHref }: { label: string; value: number | string; sub?: string; icon: string; href?: string; subHref?: string }) {
  // Main area (icon/value/label) links to `href`; the sub links separately to
  // `subHref` — kept as sibling links so no anchor is ever nested in another.
  const main = (
    <>
      <div style={{ color: "var(--or)", fontSize: "1.05rem", marginBottom: ".4rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="hd" style={{ fontSize: "1.9rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{label}</div>
    </>
  );
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      {href ? (
        <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{main}</Link>
      ) : (
        main
      )}
      {sub && (
        subHref ? (
          <Link href={subHref} style={{ fontSize: ".72rem", color: "var(--or)", marginTop: ".2rem", display: "inline-block", textDecoration: "none" }}>{sub} →</Link>
        ) : (
          <div style={{ fontSize: ".72rem", color: "var(--or)", marginTop: ".2rem" }}>{sub}</div>
        )
      )}
    </div>
  );
}
