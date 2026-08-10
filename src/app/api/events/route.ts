import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { getEvents } from "@/lib/queries";
import { uniqueSlug, formatDateTime } from "@/lib/utils";
import { sendEmail, emailShell, eventButton, emailConfigured } from "@/lib/email";
import { notifyMany } from "@/lib/notifications";
import { absoluteUrl } from "@/lib/site";
import { parseAmenityParam } from "@/lib/amenities";

export const GET = handle(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const events = await getEvents({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    amenities: parseAmenityParam(searchParams.get("amenities")),
  });
  return ok({ events });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role === "ENTHUSIAST") {
    return fail("Only hosts and venues can create events", 403);
  }

  const data = eventSchema.parse(await req.json());

  // Attach the organiser's club automatically if they have one.
  const clubId = user.club?.id ?? null;

  // If a venueId is supplied, make sure it exists.
  let venueId: string | null = null;
  let venueAmenities = "";
  if (data.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
    if (!venue) return fail("Selected venue not found", 400);
    venueId = venue.id;
    venueAmenities = venue.amenities;
  } else if (user.venue) {
    // A venue account defaults its own events to its venue.
    venueId = user.venue.id;
    venueAmenities = user.venue.amenities;
  }

  // Build the list of occurrence start times for recurring events.
  const baseStart = new Date(data.startsAt);
  const baseEnd = data.endsAt ? new Date(data.endsAt) : null;
  const durationMs = baseEnd ? baseEnd.getTime() - baseStart.getTime() : null;
  const recurrence = data.recurrence ?? "NONE";
  const count = recurrence === "NONE" ? 1 : Math.min(Math.max(data.occurrences ?? 1, 1), 26);
  const seriesId = count > 1 ? uniqueSlug(data.title) : null;

  function occurrenceStart(i: number): Date {
    const d = new Date(baseStart);
    if (recurrence === "WEEKLY") d.setDate(d.getDate() + 7 * i);
    else if (recurrence === "FORTNIGHTLY") d.setDate(d.getDate() + 14 * i);
    else if (recurrence === "MONTHLY") d.setMonth(d.getMonth() + i);
    return d;
  }

  const shared = {
    description: data.description,
    type: data.type,
    status: data.status ?? "PUBLISHED",
    city: data.city,
    region: data.region || null,
    address: data.address || null,
    lat: data.lat,
    lng: data.lng,
    imageUrl: data.imageUrl || null,
    capacity: data.capacity || null,
    priceInfo: data.priceInfo || null,
    // Featured placement is a paid promotion (see /api/events/[id]/promote),
    // never set for free at creation.
    featured: false,
    // Explicit selection wins; otherwise inherit the venue's amenities.
    amenities: data.amenities ?? venueAmenities,
    organiserId: user.id,
    clubId,
    venueId,
    seriesId,
  };

  let firstEvent: { id: string; slug: string; status: string; title: string; startsAt: Date; city: string } | null = null;
  for (let i = 0; i < count; i++) {
    const start = occurrenceStart(i);
    const created = await prisma.event.create({
      data: {
        ...shared,
        title: data.title,
        slug: uniqueSlug(data.title),
        startsAt: start,
        endsAt: durationMs !== null ? new Date(start.getTime() + durationMs) : null,
      },
    });
    if (i === 0) firstEvent = created;
  }
  const event = firstEvent!;

  // Alert club followers when a new event goes straight to published — an
  // in-app notification for everyone, plus an email when Resend is configured.
  if (event.status === "PUBLISHED" && clubId) {
    const follows = await prisma.clubFollow.findMany({
      where: { clubId },
      include: { user: { select: { id: true, email: true } }, club: { select: { name: true } } },
      take: 500,
    });
    const clubName = follows[0]?.club.name ?? user.club?.name ?? "A club you follow";
    const url = absoluteUrl(`/events/${event.slug}`);

    await notifyMany(
      follows.map((f) => f.user.id),
      {
        type: "NEW_EVENT",
        message: `${clubName} announced a new event: ${event.title}`,
        link: `/events/${event.slug}`,
      },
      user.id,
    );

    if (emailConfigured()) {
      for (const f of follows) {
        await sendEmail({
          to: f.user.email,
          subject: `New event from ${f.club.name}: ${event.title}`,
          html: emailShell(
            `${f.club.name} just announced an event`,
            `<p style="margin:0 0 8px"><strong>${event.title}</strong></p>
             <p style="margin:0;color:#aaa">📅 ${formatDateTime(event.startsAt)}<br/>📍 ${event.city}</p>
             ${eventButton(url)}`,
          ),
        });
      }
    }
  }

  return ok({ id: event.id, slug: event.slug }, 201);
});
