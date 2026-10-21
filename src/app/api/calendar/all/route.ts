import { eventsFeed, calendarResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

// All upcoming events across RevMeets.
export async function GET() {
  const rows = await eventsFeed({});
  return calendarResponse("RevMeets — All Events", rows);
}
