import { prisma } from "@/lib/prisma";
import { eventsFeed, calendarResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

// Upcoming events organised by one club.
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const club = await prisma.club.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!club) return new Response("Club not found", { status: 404 });
  const rows = await eventsFeed({ clubId: club.id });
  return calendarResponse(`RevMeet — ${club.name}`, rows);
}
