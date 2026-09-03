import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MapView } from "@/components/MapView";
import { EventCard } from "@/components/EventCard";
import { FollowButton } from "@/components/FollowButton";
import { AmenityList } from "@/components/AmenityList";
import { ReviewSection } from "@/components/ReviewSection";
import { CalendarSubscribe } from "@/components/CalendarSubscribe";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { EnquiryButton } from "@/components/EnquiryButton";
import { JsonLd } from "@/components/JsonLd";
import { getSavedEventIds } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import { parseAmenities } from "@/lib/amenities";

export const dynamic = "force-dynamic";

const getVenue = cache((slug: string) =>
  prisma.venue.findUnique({
    where: { slug },
    include: {
      _count: { select: { follows: true } },
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { registrations: true } }, club: { select: { name: true } } },
      },
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return { title: "Venue not found" };

  const desc =
    venue.description.length > 155 ? `${venue.description.slice(0, 152)}…` : venue.description;

  return {
    title: `${venue.name} — Car Event Venue in ${venue.city}`,
    description: desc,
    alternates: { canonical: `/venues/${venue.slug}` },
    openGraph: {
      type: "profile",
      title: venue.name,
      description: desc,
      url: absoluteUrl(`/venues/${venue.slug}`),
      ...(venue.imageUrl ? { images: [{ url: venue.imageUrl }] } : {}),
    },
  };
}

export default async function VenueDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const venue = await getVenue(slug);

  if (!venue) notFound();

  const following = session
    ? !!(await prisma.venueFollow.findUnique({
        where: { userId_venueId: { userId: session.sub, venueId: venue.id } },
      }))
    : false;

  const cats = venue.categories.split(",").map((c) => c.trim()).filter(Boolean);
  const amenities = parseAmenities(venue.amenities);
  const savedSet = session
    ? await getSavedEventIds(session.sub, venue.events.map((e) => e.id))
    : new Set<string>();
  const fallback = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80";

  // Reviews
  const reviewRows = await prisma.review.findMany({
    where: { venueId: venue.id },
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
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const myRating = session
    ? reviewRows.find((r) => r.userId === session.sub)?.rating ?? null
    : null;
  const isOwner = session?.sub === venue.ownerId;

  const venueLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: venue.name,
    description: venue.description,
    url: absoluteUrl(`/venues/${venue.slug}`),
    ...(venue.imageUrl ? { image: venue.imageUrl } : {}),
    ...(venue.website ? { sameAs: [venue.website] } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address || undefined,
      addressLocality: venue.city,
      postalCode: venue.postcode || undefined,
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.lat,
      longitude: venue.lng,
    },
    ...(venue.capacity ? { maximumAttendeeCapacity: venue.capacity } : {}),
    ...(amenities.length ? { amenityFeature: amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a.label, value: true })) } : {}),
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
      <JsonLd data={venueLd} />
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <Image src={venue.imageUrl || fallback} alt={venue.name} fill priority sizes="100vw" style={{ objectFit: "cover", filter: "brightness(.4)" }} />
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
              <h1 className="hd" style={{ fontSize: "clamp(2rem,5vw,3.25rem)", lineHeight: 1, display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
                {venue.name}
                {venue.verified && <VerifiedBadge size="1rem" withLabel />}
              </h1>
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
                  <AmenityList amenities={venue.amenities} />
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
                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ display: "block", textAlign: "center" }}>
                      <i className="fas fa-globe" /> Visit Website
                    </a>
                  </div>
                )}
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)", marginBottom: ".5rem" }}>
                    Host an event here?
                  </div>
                  <EnquiryButton venueId={venue.id} venueName={venue.name} loggedIn={!!session} isOwner={session?.sub === venue.ownerId} />
                </div>
              </div>
            </aside>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem", margin: "2.5rem 0 1.25rem" }}>
            <h2 className="hd" style={{ fontSize: "1.75rem" }}>
              Events Here ({venue.events.length})
            </h2>
            {venue.events.length > 0 && <CalendarSubscribe path={`/api/calendar/venue/${venue.slug}`} label="Subscribe to calendar" />}
          </div>
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
                    amenities: e.amenities || venue.amenities,
                    featured: e.featured,
                    saved: savedSet.has(e.id),
                  }}
                />
              ))}
            </div>
          )}

          <ReviewSection
            target="venue"
            targetId={venue.id}
            reviews={reviews}
            average={avgRating}
            canReview={!!session && !isOwner}
            myRating={myRating}
            loggedIn={!!session}
            disabledReason={
              !session
                ? "Log in to leave a review."
                : isOwner
                  ? "You can't review your own venue."
                  : null
            }
          />
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
