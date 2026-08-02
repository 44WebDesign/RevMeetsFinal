import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MapView } from "@/components/MapView";
import { EventCard } from "@/components/EventCard";
import { FollowButton } from "@/components/FollowButton";

export const dynamic = "force-dynamic";

export default async function VenueDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const venue = await prisma.venue.findUnique({
    where: { slug },
    include: {
      _count: { select: { follows: true } },
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { registrations: true } }, club: { select: { name: true } } },
      },
    },
  });

  if (!venue) notFound();

  const following = session
    ? !!(await prisma.venueFollow.findUnique({
        where: { userId_venueId: { userId: session.sub, venueId: venue.id } },
      }))
    : false;

  const cats = venue.categories.split(",").map((c) => c.trim()).filter(Boolean);
  const amenities = venue.amenities.split(",").map((c) => c.trim()).filter(Boolean);
  const fallback = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={venue.imageUrl || fallback} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.4)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,8,.2), var(--bg))" }} />
      </div>

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginTop: "-4rem", position: "relative" }}>
            <div>
              <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
                {cats.map((c) => (
                  <span key={c} className="pill" style={{ background: "rgba(0,188,212,.12)", border: "1px solid rgba(0,188,212,.25)", color: "#00BCD4" }}>
                    {c}
                  </span>
                ))}
              </div>
              <h1 className="hd" style={{ fontSize: "clamp(2rem,5vw,3.25rem)", lineHeight: 1 }}>{venue.name}</h1>
              <p style={{ color: "var(--mut)", marginTop: ".5rem" }}>
                <i className="fas fa-location-dot" style={{ color: "#00BCD4" }} /> {venue.address}, {venue.city}
                {venue.postcode ? ` ${venue.postcode}` : ""}
              </p>
            </div>
            <FollowButton kind="venue" id={venue.id} initialFollowing={following} initialFollowers={venue._count.follows} loggedIn={!!session} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem", marginTop: "1.5rem" }} className="detail-grid">
            <div>
              <p style={{ color: "rgba(245,245,245,.82)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{venue.description}</p>

              {amenities.length > 0 && (
                <>
                  <h2 className="hd" style={{ fontSize: "1.5rem", margin: "2rem 0 1rem" }}>Amenities</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                    {amenities.map((a) => (
                      <span key={a} className="tag" style={{ cursor: "default" }}>
                        <i className="fas fa-check" style={{ color: "#00BCD4", marginRight: 5 }} /> {a}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h2 className="hd" style={{ fontSize: "1.5rem", margin: "2rem 0 1rem" }}>Find Us</h2>
              <MapView
                points={[{ id: venue.id, slug: venue.slug, lat: venue.lat, lng: venue.lng, title: venue.name, type: "VENUE", color: "#00BCD4", subtitle: venue.city, href: `/venues/${venue.slug}`, kind: "venue" }]}
                center={[venue.lat, venue.lng]}
                zoom={13}
                height={300}
              />
            </div>

            <aside>
              <div className="card-surface" style={{ padding: "1.5rem" }}>
                {venue.capacity && (
                  <InfoRow icon="fa-users" label="Capacity" value={`Up to ${venue.capacity}`} />
                )}
                <InfoRow icon="fa-city" label="City" value={venue.city} />
                {venue.website && (
                  <div style={{ marginTop: "1rem" }}>
                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="btn-or" style={{ display: "block", textAlign: "center" }}>
                      <i className="fas fa-globe" /> Visit Website
                    </a>
                  </div>
                )}
              </div>
            </aside>
          </div>

          <h2 className="hd" style={{ fontSize: "1.75rem", margin: "2.5rem 0 1.25rem" }}>
            Events Here ({venue.events.length})
          </h2>
          {venue.events.length === 0 ? (
            <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>
              No events scheduled at this venue yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.5rem" }}>
              {venue.events.map((e) => (
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
                    clubName: e.club?.name ?? null,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`@media (max-width: 860px){.detail-grid{grid-template-columns:1fr !important}}`}</style>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid var(--bdr)", fontSize: ".88rem" }}>
      <span style={{ color: "var(--mut)" }}>
        <i className={`fas ${icon}`} style={{ color: "#00BCD4", marginRight: 6 }} /> {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
