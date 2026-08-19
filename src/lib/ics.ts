// iCalendar (.ics) generation for subscribable calendar feeds. Pure functions
// with no framework/DB dependency so they're easy to unit-test.

export type IcsEvent = {
  uid: string; // stable per event, so re-fetches update rather than duplicate
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date | null;
  url?: string;
};

// ISO date → iCalendar UTC timestamp: 20260815T100000Z
export function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold content lines to <=75 octets per RFC 5545 (continuation lines start
// with a single space).
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

export function buildCalendar(name: string, events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RevMeet//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(name)}`,
    // Ask subscribers to refresh roughly every 6 hours.
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  const now = new Date();
  for (const e of events) {
    const end = e.end ?? new Date(e.start.getTime() + 2 * 3600_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(e.uid)}`,
      `DTSTAMP:${icsStamp(now)}`,
      `DTSTART:${icsStamp(e.start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${escapeIcs(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeIcs(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeIcs(e.location)}`);
    if (e.url) lines.push(`URL:${escapeIcs(e.url)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
