import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListingActions } from "@/components/admin/AdminListingActions";

export const dynamic = "force-dynamic";

type SP = { q?: string; kind?: string; verified?: string; featured?: string };

// Admin view for verifying clubs & venues (trust badge) and overriding featured.
export default async function AdminListings({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ci = "insensitive" as const;

  const common = (nameField: "name") => {
    const where: Record<string, unknown> = {};
    const and: unknown[] = [];
    if (sp.q) and.push({ OR: [{ [nameField]: { contains: sp.q, mode: ci } }, { owner: { email: { contains: sp.q, mode: ci } } }] });
    if (sp.verified === "yes") where.verified = true;
    else if (sp.verified === "no") where.verified = false;
    if (sp.featured === "yes") where.featured = true;
    if (and.length) where.AND = and;
    return where;
  };

  const showClubs = sp.kind !== "venues";
  const showVenues = sp.kind !== "clubs";

  const [clubs, venues] = await Promise.all([
    showClubs
      ? prisma.club.findMany({
          where: common("name"),
          orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
          take: 100,
          include: { owner: { select: { email: true } }, _count: { select: { events: true } } },
        })
      : Promise.resolve([]),
    showVenues
      ? prisma.venue.findMany({
          where: common("name"),
          orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
          take: 100,
          include: { owner: { select: { email: true } }, _count: { select: { events: true } } },
        })
      : Promise.resolve([]),
  ]);

  const hasFilters = !!(sp.q || sp.kind || sp.verified || sp.featured);

  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: ".5rem" }}>Listings</h1>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.25rem" }}>
        Grant the <strong>Verified</strong> badge after a genuine check (a real business, accurate details).
        It&apos;s a trust signal — never sell it for a fee alone.
      </p>

      <form method="get" className="admin-filter-bar">
        <input name="q" defaultValue={sp.q} className="field-input" placeholder="Search name or owner email…" style={{ flex: "1 1 180px", minWidth: 0 }} />
        <select name="kind" defaultValue={sp.kind ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Clubs &amp; venues</option>
          <option value="clubs">Clubs only</option>
          <option value="venues">Venues only</option>
        </select>
        <select name="verified" defaultValue={sp.verified ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Any verification</option>
          <option value="yes">Verified</option>
          <option value="no">Unverified</option>
        </select>
        <select name="featured" defaultValue={sp.featured ?? ""} className="field-select" style={{ width: "auto" }}>
          <option value="">Featured &amp; not</option>
          <option value="yes">Featured only</option>
        </select>
        <button className="btn-or" style={{ padding: "0 1rem", whiteSpace: "nowrap" }}><i className="fas fa-search" /> Filter</button>
        {hasFilters && <Link href="/admin/listings" className="btn-ghost" style={{ fontSize: ".82rem" }}>Clear</Link>}
      </form>

      {showClubs && (
      <Section title={`Clubs (${clubs.length})`}>
        {clubs.length === 0 && <EmptyRow />}
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
      )}

      {showVenues && (
      <Section title={`Venues (${venues.length})`}>
        {venues.length === 0 && <EmptyRow />}
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
      )}
    </div>
  );
}

function EmptyRow() {
  return <div style={{ padding: "1.5rem 1.25rem", textAlign: "center", color: "var(--mut)", fontSize: ".85rem" }}>None match these filters.</div>;
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
