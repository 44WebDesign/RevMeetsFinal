import { prisma } from "@/lib/prisma";
import { eventsFeed, calendarResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

// Upcoming events held at one venue.
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const venue = await prisma.venue.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!venue) return new Response("Venue not found", { status: 404 });
  const rows = await eventsFeed({ venueId: venue.id });
  return calendarResponse(`RevMeet — ${venue.name}`, rows);
}
