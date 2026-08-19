import { eventsFeed, calendarResponse } from "@/lib/calendar";

export const dynamic = "force-dynamic";

// All upcoming events across RevMeet.
export async function GET() {
  const rows = await eventsFeed({});
  return calendarResponse("RevMeet — All Events", rows);
}
