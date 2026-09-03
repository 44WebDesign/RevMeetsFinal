import { prisma } from "./prisma";
import { eventTypeColor, eventTypeLabel } from "./enums";
import type { EventCardData } from "@/components/EventCard";
import type { ClubCardData } from "@/components/ClubCard";
import type { VenueCardData } from "@/components/VenueCard";
import type { MapPoint } from "@/components/MapView";

export type EventFilters = {
  q?: string;
  type?: string;
  city?: string;
  from?: string;
  to?: string;
  amenities?: string[]; // canonical keys; event must have ALL of them
  take?: number;
};

// Build a Prisma `where` clause from search filters.
function eventWhere(filters: EventFilters) {
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  const and: unknown[] = [];

  const ci = "insensitive" as const;
  if (filters.type) where.type = filters.type;
  if (filters.city) where.city = { contains: filters.city, mode: ci };
  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: ci } },
        { description: { contains: filters.q, mode: ci } },
        { city: { contains: filters.q, mode: ci } },
      ],
    });
  }
  // Each selected amenity must be on the event itself OR its linked venue
  // (events created before the amenity feature inherit from their venue).
  if (filters.amenities?.length) {
    for (const key of filters.amenities) {
      and.push({
        OR: [
          { amenities: { contains: key } },
          { venue: { amenities: { contains: key } } },
        ],
      });
    }
  }
  const startsAt: Record<string, Date> = {};
  if (filters.from) startsAt.gte = new Date(filters.from);
  if (filters.to) {
    const to = new Date(filters.to);
    to.setHours(23, 59, 59, 999);
    startsAt.lte = to;
  }
  if (Object.keys(startsAt).length) where.startsAt = startsAt;
  if (and.length) where.AND = and;
  return where;
}

export async function getEvents(
  filters: EventFilters = {},
  userId?: string,
): Promise<EventCardData[]> {
  const events = await prisma.event.findMany({
    where: eventWhere(filters),
    orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
    take: filters.take ?? 60,
    include: {
      club: { select: { name: true } },
      venue: { select: { amenities: true } },
      reviews: { select: { rating: true } },
      _count: { select: { registrations: true } },
      ...(userId ? { savedBy: { where: { userId }, select: { id: true } } } : {}),
    },
  });

  return events.map(toEventCard(userId));
}

// Shared row → EventCardData mapper (used by the list + explorer queries).
function toEventCard(userId?: string) {
  return (e: {
    id: string; slug: string; title: string; description: string; type: string; city: string;
    startsAt: Date; imageUrl: string | null; amenities: string; featured: boolean; capacity: number | null;
    club?: { name: string } | null; venue?: { amenities: string } | null;
    reviews: { rating: number }[]; _count: { registrations: number }; savedBy?: unknown[];
  }): EventCardData => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    type: e.type,
    city: e.city,
    startsAt: e.startsAt.toISOString(),
    imageUrl: e.imageUrl,
    attendees: e._count.registrations,
    capacity: e.capacity,
    clubName: e.club?.name ?? null,
    amenities: e.amenities || e.venue?.amenities || "",
    featured: e.featured,
    rating: e.reviews.length ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length : null,
    reviewCount: e.reviews.length,
    saved: userId ? (e.savedBy?.length ?? 0) > 0 : false,
  });
}

// Full event rows (card data + coordinates) for the client-side events
// explorer, which filters and maps from a single fetched set.
export type ExplorerEvent = EventCardData & { lat: number; lng: number };

export async function getExplorerEvents(userId?: string): Promise<ExplorerEvent[]> {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
    take: 500,
    include: {
      club: { select: { name: true } },
      venue: { select: { amenities: true } },
      reviews: { select: { rating: true } },
      _count: { select: { registrations: true } },
      ...(userId ? { savedBy: { where: { userId }, select: { id: true } } } : {}),
    },
  });
  const map = toEventCard(userId);
  return events.map((e) => ({ ...map(e), lat: e.lat, lng: e.lng }));
}

// ---- Homepage spotlight (paid featured placement) ----
export type SpotlightItem = {
  kind: "event" | "club" | "venue";
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  accent: string;
  icon: string;
};

// Currently-featured events/clubs/venues, interleaved into a short mixed list
// for the homepage spotlight. Empty when nothing is promoted (section hides).
export async function getSpotlight(limit = 3): Promise<SpotlightItem[]> {
  const now = new Date();
  const featured = { featured: true, featuredUntil: { gt: now } };

  const [events, clubs, venues] = await Promise.all([
    prisma.event.findMany({
      where: { ...featured, status: "PUBLISHED" },
      orderBy: { featuredUntil: "desc" },
      take: limit,
      select: { slug: true, title: true, type: true, city: true, imageUrl: true },
    }),
    prisma.club.findMany({
      where: featured,
      orderBy: { featuredUntil: "desc" },
      take: limit,
      select: { slug: true, name: true, location: true, imageUrl: true },
    }),
    prisma.venue.findMany({
      where: featured,
      orderBy: { featuredUntil: "desc" },
      take: limit,
      select: { slug: true, name: true, city: true, imageUrl: true },
    }),
  ]);

  const byKind: SpotlightItem[][] = [
    events.map((e) => ({
      kind: "event" as const,
      title: e.title,
      subtitle: `${eventTypeLabel(e.type)} · ${e.city}`,
      href: `/events/${e.slug}`,
      imageUrl: e.imageUrl,
      accent: eventTypeColor(e.type),
      icon: "fa-calendar-star",
    })),
    clubs.map((c) => ({
      kind: "club" as const,
      title: c.name,
      subtitle: `Car club · ${c.location}`,
      href: `/clubs/${c.slug}`,
      imageUrl: c.imageUrl,
      accent: "#FF5F1F",
      icon: "fa-users-gear",
    })),
    venues.map((v) => ({
      kind: "venue" as const,
      title: v.name,
      subtitle: `Venue · ${v.city}`,
      href: `/venues/${v.slug}`,
      imageUrl: v.imageUrl,
      accent: "#00BCD4",
      icon: "fa-warehouse",
    })),
  ];

  // Round-robin so a single busy type doesn't fill every slot.
  const mixed: SpotlightItem[] = [];
  for (let i = 0; mixed.length < limit; i++) {
    let added = false;
    for (const list of byKind) {
      if (list[i]) {
        mixed.push(list[i]);
        added = true;
        if (mixed.length >= limit) break;
      }
    }
    if (!added) break;
  }
  return mixed;
}

// A recent published event's cover image, for the homepage hero — real
// community content over generic stock. Null when none have an image.
export async function getHeroImage(): Promise<string | null> {
  const e = await prisma.event.findFirst({
    where: { status: "PUBLISHED", imageUrl: { not: null } },
    orderBy: [{ featured: "desc" }, { startsAt: "asc" }],
    select: { imageUrl: true },
  });
  return e?.imageUrl ?? null;
}

export async function getEventMapPoints(filters: EventFilters = {}): Promise<MapPoint[]> {
  const events = await prisma.event.findMany({
    where: eventWhere(filters),
    orderBy: { startsAt: "asc" },
    take: 300,
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      city: true,
      lat: true,
      lng: true,
      startsAt: true,
      amenities: true,
      venue: { select: { amenities: true } },
    },
  });

  return events.map((e) => ({
    id: e.id,
    slug: e.slug,
    lat: e.lat,
    lng: e.lng,
    title: e.title,
    type: e.type,
    amenities: e.amenities || e.venue?.amenities || "",
    color: eventTypeColor(e.type),
    subtitle: `${e.city} · ${e.startsAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`,
    href: `/events/${e.slug}`,
    kind: "event" as const,
  }));
}

export async function getVenueMapPoints(): Promise<MapPoint[]> {
  const venues = await prisma.venue.findMany({
    select: { id: true, slug: true, name: true, city: true, lat: true, lng: true, amenities: true },
  });
  return venues.map((v) => ({
    id: v.id,
    slug: v.slug,
    lat: v.lat,
    lng: v.lng,
    title: v.name,
    type: "VENUE",
    amenities: v.amenities,
    color: "#00BCD4",
    subtitle: v.city,
    href: `/venues/${v.slug}`,
    kind: "venue" as const,
  }));
}

export async function getClubs(q?: string): Promise<ClubCardData[]> {
  const clubs = await prisma.club.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { follows: true, events: true } },
      reviews: { select: { rating: true } },
    },
  });
  return clubs.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    location: c.location,
    imageUrl: c.imageUrl,
    categories: c.categories,
    followers: c._count.follows,
    events: c._count.events,
    featured: c.featured,
    rating: c.reviews.length ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : null,
    reviewCount: c.reviews.length,
  }));
}

export async function getVenues(q?: string, amenities?: string[]): Promise<VenueCardData[]> {
  const and: Record<string, unknown>[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  for (const key of amenities ?? []) {
    and.push({ amenities: { contains: key } });
  }
  const venues = await prisma.venue.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { follows: true } },
      reviews: { select: { rating: true } },
    },
  });
  return venues.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    description: v.description,
    city: v.city,
    address: v.address,
    imageUrl: v.imageUrl,
    categories: v.categories,
    followers: v._count.follows,
    capacity: v.capacity,
    amenities: v.amenities,
    lat: v.lat,
    lng: v.lng,
    featured: v.featured,
    rating: v.reviews.length ? v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length : null,
    reviewCount: v.reviews.length,
  }));
}

// Which of the given event IDs the user has saved (for marking inline card
// lists on club/venue/dashboard pages).
export async function getSavedEventIds(
  userId: string,
  eventIds: string[],
): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();
  const rows = await prisma.savedEvent.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true },
  });
  return new Set(rows.map((r) => r.eventId));
}

// Distinct cities with published events — powers the city landing pages.
export async function getEventCities(): Promise<string[]> {
  const rows = await prisma.event.groupBy({
    by: ["city"],
    where: { status: "PUBLISHED" },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 50,
  });
  return rows.map((r) => r.city);
}

export async function getStats() {
  const [events, users, clubs, venues, cityRows] = await Promise.all([
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.club.count(),
    prisma.venue.count(),
    prisma.event.groupBy({ by: ["city"], where: { status: "PUBLISHED" } }),
  ]);
  return { events, users, clubs, venues: clubs + venues, cities: cityRows.length };
}
