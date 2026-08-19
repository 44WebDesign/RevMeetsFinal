import { prisma } from "./prisma";
import { buildCalendar, type IcsEvent } from "./ics";
import { absoluteUrl } from "./site";

// Shared query + response helpers for the public .ics feed routes. Feeds list
// upcoming published events (from now), capped, so calendar apps stay light.

const FEED_LIMIT = 100;

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  city: string;
  region: string | null;
  address: string | null;
  startsAt: Date;
  endsAt: Date | null;
};

function toIcs(rows: EventRow[]): IcsEvent[] {
  return rows.map((e) => ({
    uid: `${e.id}@revmeet`,
    title: e.title,
    description: `${e.description}\n\n${absoluteUrl(`/events/${e.slug}`)}`,
    location: [e.address, e.city, e.region].filter(Boolean).join(", "),
    start: e.startsAt,
    end: e.endsAt,
    url: absoluteUrl(`/events/${e.slug}`),
  }));
}

const SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  city: true,
  region: true,
  address: true,
  startsAt: true,
  endsAt: true,
} as const;

export async function eventsFeed(
  where: Record<string, unknown>,
): Promise<EventRow[]> {
  return prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() }, ...where },
    orderBy: { startsAt: "asc" },
    take: FEED_LIMIT,
    select: SELECT,
  });
}

// Wrap event rows into a downloadable/subscribable calendar Response.
export function calendarResponse(name: string, rows: EventRow[]): Response {
  const body = buildCalendar(name, toIcs(rows));
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="revmeet.ics"`,
      // Let calendar clients and CDNs cache briefly.
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
