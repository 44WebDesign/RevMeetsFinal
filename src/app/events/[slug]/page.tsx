import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MapView } from "@/components/MapView";
import { AttendButton } from "@/components/AttendButton";
import { ReviewSection } from "@/components/ReviewSection";
import { AmenityList } from "@/components/AmenityList";
import { SaveButton } from "@/components/SaveButton";
import { AddToCalendar } from "@/components/AddToCalendar";
import { ShareBar } from "@/components/ShareBar";
import { JsonLd } from "@/components/JsonLd";
import { parseAmenities } from "@/lib/amenities";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDateTime } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// Cached so generateMetadata and the page share a single query per request.
const getEvent = cache((slug: string) =>
  prisma.event.findUnique({
    where: { slug },
    include: {
      club: true,
      venue: true,
      organiser: { select: { name: true, avatarColor: true } },
      _count: { select: { registrations: true } },
    },
  }),
);

const FALLBACK_EVENT_IMG =
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };

  const when = formatDateTime(event.startsAt);
  const desc =
    event.description.length > 155
      ? `${event.description.slice(0, 152)}…`
      : event.description;
  const url = absoluteUrl(`/events/${event.slug}`);
  const image = event.imageUrl || FALLBACK_EVENT_IMG;

  return {
    title: `${event.title} — ${event.city}, ${when}`,
    description: desc,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "article",
      title: event.title,
      description: desc,
      url,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: desc,
      images: [image],
    },
  };
}

export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const event = await getEvent(slug);

  if (!event) notFound();

  const registered = session
    ? !!(await prisma.registration.findUnique({
        where: { userId_eventId: { userId: session.sub, eventId: event.id } },
      }))
    : false;

  // Reviews (list + the caller's own, for the form's initial state)
  const reviewRows = await prisma.review.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, avatarColor: true } } },
  });
  const reviews = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    author: r.user.name,
    avatarColor: r.user.avatarColor,
    createdAt: r.createdAt.toISOString(),
  }));
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
  const myRating = session
    ? reviewRows.find((r) => r.userId === session.sub)?.rating ?? null
    : null;
  const eventStarted = event.startsAt <= new Date();

  const saved = session
    ? !!(await prisma.savedEvent.findUnique({
        where: { userId_eventId: { userId: session.sub, eventId: event.id } },
      }))
    : false;
  const eventUrl = absoluteUrl(`/events/${event.slug}`);
  const locationText = [event.address, event.city, event.region].filter(Boolean).join(", ");

  const color = eventTypeColor(event.type);
  const full = !!event.capacity && event._count.registrations >= event.capacity;
  const fallbackImg = FALLBACK_EVENT_IMG;

  // Event's own amenity selection; events created before this feature fall
  // back to their venue's amenities.
  const amenitiesStr = event.amenities || event.venue?.amenities || "";
  const amenityItems = parseAmenities(amenitiesStr);

  // Schema.org Event — powers Google's event rich results.
  const priceMatch = event.priceInfo?.match(/([\d]+(?:\.\d{1,2})?)/);
  const isFree = /free/i.test(event.priceInfo ?? "");
  const offers =
    isFree || priceMatch
      ? {
          "@type": "Offer",
          price: isFree ? 0 : Number(priceMatch![1]),
          priceCurrency: "GBP",
          availability: full
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
          url: absoluteUrl(`/events/${event.slug}`),
        }
      : undefined;

  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
    eventStatus:
      event.status === "CANCELLED"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [event.imageUrl || fallbackImg],
    url: absoluteUrl(`/events/${event.slug}`),
    location: {
      "@type": "Place",
      name: event.venue?.name || `${event.city}${event.region ? `, ${event.region}` : ""}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address || undefined,
        addressLocality: event.city,
        addressRegion: event.region || undefined,
        addressCountry: "GB",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: event.lat,
        longitude: event.lng,
      },
      ...(amenityItems.length
        ? {
            amenityFeature: amenityItems.map((a) => ({
              "@type": "LocationFeatureSpecification",
              name: a.label,
              value: true,
            })),
          }
        : {}),
    },
    organizer: {
      "@type": "Organization",
      name: event.club?.name || event.organiser.name,
      ...(event.club ? { url: absoluteUrl(`/clubs/${event.club.slug}`) } : {}),
    },
    ...(offers ? { offers } : {}),
    ...(avgRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={eventLd} />
      {/* Hero image */}
      <div style={{ position: "relative", height: 360, overflow: "hidden" }}>
        <Image
          src={event.imageUrl || fallbackImg}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", filter: "brightness(.45)" }}
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

              {amenityItems.length > 0 && (
                <>
                  <h2 className="hd" style={{ fontSize: "1.75rem", margin: "2.5rem 0 1rem" }}>
                    What&apos;s There
                  </h2>
                  <AmenityList amenities={amenitiesStr} accent={color} />
                </>
              )}

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

              <ReviewSection
                eventId={event.id}
                reviews={reviews}
                average={avgRating}
                canReview={registered}
                myRating={myRating}
                loggedIn={!!session}
                eventStarted={eventStarted}
              />
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

                <div style={{ display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
                  <SaveButton eventId={event.id} initialSaved={saved} loggedIn={!!session} />
                  <AddToCalendar
                    title={event.title}
                    description={event.description}
                    location={locationText}
                    start={event.startsAt.toISOString()}
                    end={event.endsAt ? event.endsAt.toISOString() : null}
                    url={eventUrl}
                  />
                </div>

                <div style={{ borderTop: "1px solid var(--bdr)", margin: "1.25rem 0 1rem", paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)", marginBottom: ".6rem" }}>
                    Share
                  </div>
                  <ShareBar url={eventUrl} title={event.title} />
                </div>

                <div style={{ borderTop: "1px solid var(--bdr)", margin: "0 0 1.25rem", paddingTop: "1.25rem" }}>
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
