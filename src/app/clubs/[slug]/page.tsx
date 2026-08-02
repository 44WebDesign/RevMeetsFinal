import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EventCard } from "@/components/EventCard";
import { FollowButton } from "@/components/FollowButton";

export const dynamic = "force-dynamic";

export default async function ClubDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      _count: { select: { follows: true } },
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { registrations: true } } },
      },
    },
  });

  if (!club) notFound();

  const following = session
    ? !!(await prisma.clubFollow.findUnique({
        where: { userId_clubId: { userId: session.sub, clubId: club.id } },
      }))
    : false;

  const cats = club.categories.split(",").map((c) => c.trim()).filter(Boolean);
  const fallback = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={club.imageUrl || fallback} alt={club.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.4)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,8,.2), var(--bg))" }} />
      </div>

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginTop: "-4rem", position: "relative" }}>
            <div>
              <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
                {cats.map((c) => (
                  <span key={c} className="pill" style={{ background: "rgba(255,95,31,.12)", border: "1px solid rgba(255,95,31,.25)", color: "var(--or)" }}>
                    {c}
                  </span>
                ))}
              </div>
              <h1 className="hd" style={{ fontSize: "clamp(2rem,5vw,3.25rem)", lineHeight: 1 }}>{club.name}</h1>
              <p style={{ color: "var(--mut)", marginTop: ".5rem" }}>
                <i className="fas fa-location-dot" style={{ color: "var(--or)" }} /> {club.location}
                {club.website && (
                  <>
                    {"  ·  "}
                    <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--or)", textDecoration: "none" }}>
                      <i className="fas fa-globe" /> Website
                    </a>
                  </>
                )}
              </p>
            </div>
            <FollowButton kind="club" id={club.id} initialFollowing={following} initialFollowers={club._count.follows} loggedIn={!!session} />
          </div>

          <p style={{ color: "rgba(245,245,245,.82)", lineHeight: 1.8, marginTop: "1.5rem", maxWidth: 760, whiteSpace: "pre-wrap" }}>
            {club.description}
          </p>

          <h2 className="hd" style={{ fontSize: "1.75rem", margin: "2.5rem 0 1.25rem" }}>
            Upcoming Events ({club.events.length})
          </h2>
          {club.events.length === 0 ? (
            <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
              This club hasn&apos;t published any events yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.5rem" }}>
              {club.events.map((e) => (
                <EventCard
                  key={e.id}
                  event={{
                    id: e.id,
                    slug: e.slug,
                    title: e.title,
                    description: e.description,
                    type: e.type,
                    city: e.city,
                    startsAt: e.startsAt.toISOString(),
                    imageUrl: e.imageUrl,
                    attendees: e._count.registrations,
                    clubName: club.name,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
