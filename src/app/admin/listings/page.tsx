import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListingActions } from "@/components/admin/AdminListingActions";

export const dynamic = "force-dynamic";

// Admin view for verifying clubs & venues (trust badge) and overriding featured.
export default async function AdminListings() {
  const [clubs, venues] = await Promise.all([
    prisma.club.findMany({
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { owner: { select: { email: true } }, _count: { select: { events: true } } },
    }),
    prisma.venue.findMany({
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { owner: { select: { email: true } }, _count: { select: { events: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: ".5rem" }}>Listings</h1>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.5rem" }}>
        Grant the <strong>Verified</strong> badge after a genuine check (a real business, accurate details).
        It&apos;s a trust signal — never sell it for a fee alone.
      </p>

      <Section title={`Clubs (${clubs.length})`}>
        {clubs.map((c, i) => (
          <Row
            key={c.id}
            first={i === 0}
            href={`/clubs/${c.slug}`}
            name={c.name}
            meta={`${c.location} · ${c._count.events} events · ${c.owner.email}`}
            verified={c.verified}
            featured={c.featured}
            actions={<AdminListingActions kind="clubs" id={c.id} verified={c.verified} featured={c.featured} />}
          />
        ))}
      </Section>

      <Section title={`Venues (${venues.length})`}>
        {venues.map((v, i) => (
          <Row
            key={v.id}
            first={i === 0}
            href={`/venues/${v.slug}`}
            name={v.name}
            meta={`${v.city} · ${v._count.events} events · ${v.owner.email}`}
            verified={v.verified}
            featured={v.featured}
            actions={<AdminListingActions kind="venues" id={v.id} verified={v.verified} featured={v.featured} />}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 className="hd" style={{ fontSize: "1.2rem", marginBottom: ".75rem" }}>{title}</h2>
      <div className="card-surface" style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({
  first,
  href,
  name,
  meta,
  verified,
  featured,
  actions,
}: {
  first: boolean;
  href: string;
  name: string;
  meta: string;
  verified: boolean;
  featured: boolean;
  actions: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.25rem", borderTop: first ? "none" : "1px solid var(--bdr)", flexWrap: "wrap" }}>
      <div style={{ minWidth: 220 }}>
        <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
          <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>{name}</Link>
          {verified && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(74,163,255,.15)", color: "#4aa3ff", border: "1px solid rgba(74,163,255,.4)" }}><i className="fas fa-circle-check" /> Verified</span>}
          {featured && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,215,0,.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}><i className="fas fa-star" /> Featured</span>}
        </div>
        <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>{meta}</div>
      </div>
      {actions}
    </div>
  );
}
