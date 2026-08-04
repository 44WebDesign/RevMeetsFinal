import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { getEvents } from "@/lib/queries";
import { uniqueSlug, formatDateTime } from "@/lib/utils";
import { sendEmail, emailShell, eventButton, emailConfigured } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

export const GET = handle(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const events = await getEvents({
    q: searchParams.get("q") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
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
  if (data.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
    if (!venue) return fail("Selected venue not found", 400);
    venueId = venue.id;
  } else if (user.venue) {
    // A venue account defaults its own events to its venue.
    venueId = user.venue.id;
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      slug: uniqueSlug(data.title),
      description: data.description,
      type: data.type,
      status: data.status ?? "PUBLISHED",
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      city: data.city,
      region: data.region || null,
      address: data.address || null,
      lat: data.lat,
      lng: data.lng,
      imageUrl: data.imageUrl || null,
      capacity: data.capacity || null,
      priceInfo: data.priceInfo || null,
      organiserId: user.id,
      clubId,
      venueId,
    },
  });

  // Alert club followers when a new event goes straight to published.
  if (event.status === "PUBLISHED" && clubId && emailConfigured()) {
    const follows = await prisma.clubFollow.findMany({
      where: { clubId },
      include: { user: { select: { email: true } }, club: { select: { name: true } } },
      take: 500,
    });
    const url = absoluteUrl(`/events/${event.slug}`);
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

  return ok({ id: event.id, slug: event.slug }, 201);
});
