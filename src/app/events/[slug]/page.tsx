import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MapView } from "@/components/MapView";
import { AttendButton } from "@/components/AttendButton";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      club: true,
      venue: true,
      organiser: { select: { name: true, avatarColor: true } },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) notFound();

  const registered = session
    ? !!(await prisma.registration.findUnique({
        where: { userId_eventId: { userId: session.sub, eventId: event.id } },
      }))
    : false;

  const color = eventTypeColor(event.type);
  const full = !!event.capacity && event._count.registrations >= event.capacity;
  const fallbackImg =
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      {/* Hero image */}
      <div style={{ position: "relative", height: 360, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl || fallbackImg}
          alt={event.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.45)" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(8,8,8,.2), var(--bg))",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "2rem 1.5rem",
          }}
        >
          <span className="pill" style={{ background: color, color: "#fff" }}>
            {eventTypeLabel(event.type)}
          </span>
          <h1 className="hd" style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", marginTop: ".5rem", lineHeight: 1 }}>
            {event.title}
          </h1>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: ".75rem", color: "rgba(245,245,245,.85)", fontSize: ".9rem" }}>
            <span><i className="fas fa-calendar-alt" style={{ color }} /> {formatDateTime(event.startsAt)}</span>
            <span><i className="fas fa-location-dot" style={{ color }} /> {event.city}{event.region ? `, ${event.region}` : ""}</span>
            <span><i className="fas fa-users" style={{ color }} /> {event._count.registrations} going</span>
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingTop: "2.5rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem" }} className="detail-grid">
            {/* Main */}
            <div>
              <h2 className="hd" style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>About This Event</h2>
              <p style={{ color: "rgba(245,245,245,.82)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {event.description}
              </p>

              {event.address && (
                <>
                  <h2 className="hd" style={{ fontSize: "1.75rem", margin: "2.5rem 0 1rem" }}>Location</h2>
                  <p style={{ color: "var(--mut)", marginBottom: "1rem" }}>
                    <i className="fas fa-location-dot" style={{ color }} /> {event.address}
                  </p>
                </>
              )}
              <div style={{ marginTop: event.address ? 0 : "2rem" }}>
                <MapView
                  points={[
                    {
                      id: event.id,
                      slug: event.slug,
                      lat: event.lat,
                      lng: event.lng,
                      title: event.title,
                      type: event.type,
                      color,
                      subtitle: event.city,
                      href: `/events/${event.slug}`,
                      kind: "event",
                    },
                  ]}
                  center={[event.lat, event.lng]}
                  zoom={12}
                  height={320}
                />
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="card-surface" style={{ padding: "1.5rem", position: "sticky", top: 88 }}>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)" }}>
                    Price
                  </div>
                  <div className="hd" style={{ fontSize: "1.75rem", color: "var(--or)" }}>
                    {event.priceInfo || "Free Entry"}
                  </div>
                </div>

                {event.capacity && (
                  <div style={{ marginBottom: "1rem", fontSize: ".85rem", color: "var(--mut)" }}>
                    <i className="fas fa-user-group" /> {event._count.registrations} / {event.capacity} spaces filled
                  </div>
                )}

                <AttendButton
                  eventId={event.id}
                  initialRegistered={registered}
                  initialAttendees={event._count.registrations}
                  loggedIn={!!session}
                  full={full}
                />

                <div style={{ borderTop: "1px solid var(--bdr)", margin: "1.25rem 0", paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)", marginBottom: ".5rem" }}>
                    Organised by
                  </div>
                  {event.club ? (
                    <Link href={`/clubs/${event.club.slug}`} style={{ display: "flex", alignItems: "center", gap: ".6rem", textDecoration: "none", color: "inherit" }}>
                      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--or)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".8rem", color: "#fff" }}>
                        <i className="fas fa-users-gear" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{event.club.name}</div>
                        <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>View club →</div>
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <span style={{ width: 36, height: 36, borderRadius: "50%", background: event.organiser.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".8rem", color: "#fff" }}>
                        {event.organiser.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{event.organiser.name}</div>
                    </div>
                  )}
                </div>

                {event.venue && (
                  <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: "1.25rem" }}>
                    <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)", marginBottom: ".5rem" }}>
                      Venue
                    </div>
                    <Link href={`/venues/${event.venue.slug}`} style={{ color: "#00BCD4", textDecoration: "none", fontSize: ".9rem", fontWeight: 600 }}>
                      <i className="fas fa-warehouse" /> {event.venue.name} →
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style>{`@media (max-width: 860px){.detail-grid{grid-template-columns:1fr !important}}`}</style>
    </>
  );
}
