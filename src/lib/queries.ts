import { prisma } from "./prisma";
import { eventTypeColor } from "./enums";
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

export async function getEvents(filters: EventFilters = {}): Promise<EventCardData[]> {
  const events = await prisma.event.findMany({
    where: eventWhere(filters),
    orderBy: { startsAt: "asc" },
    take: filters.take ?? 60,
    include: {
      club: { select: { name: true } },
      venue: { select: { amenities: true } },
      _count: { select: { registrations: true } },
    },
  });

  return events.map((e) => ({
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
    amenities: e.amenities || e.venue?.amenities || "",
  }));
}

// Full event rows (card data + coordinates) for the client-side events
// explorer, which filters and maps from a single fetched set.
export type ExplorerEvent = EventCardData & { lat: number; lng: number };

export async function getExplorerEvents(): Promise<ExplorerEvent[]> {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    take: 500,
    include: {
      club: { select: { name: true } },
      venue: { select: { amenities: true } },
      _count: { select: { registrations: true } },
    },
  });
  return events.map((e) => ({
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
    amenities: e.amenities || e.venue?.amenities || "",
    lat: e.lat,
    lng: e.lng,
  }));
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
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { follows: true, events: true } },
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
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { follows: true } } },
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
  }));
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
  const [events, users, clubs, venues] = await Promise.all([
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.club.count(),
    prisma.venue.count(),
  ]);
  return { events, users, clubs, venues: clubs + venues };
}
