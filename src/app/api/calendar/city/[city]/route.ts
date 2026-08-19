import { eventsFeed, calendarResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ city: string }> };

// Upcoming events in one city (case-insensitive match on the city name).
export async function GET(_req: Request, ctx: Ctx) {
  const { city } = await ctx.params;
  const name = decodeURIComponent(city);
  const rows = await eventsFeed({ city: { equals: name, mode: "insensitive" } });
  return calendarResponse(`RevMeet — Events in ${name}`, rows);
}
