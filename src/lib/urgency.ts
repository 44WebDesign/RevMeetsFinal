// Honest urgency / scarcity helpers for listings. Everything here is derived
// from real data (the event's start time and its actual capacity vs. sign-ups)
// — never fabricated — so the cues stay trustworthy.

const DAY = 86_400_000;

export type Proximity = { label: string; urgent: boolean };

// A short "how soon" badge for near-term events, or null when it's far enough
// away that urgency would be misleading.
export function dateProximity(startsAt: Date | string, now: Date = new Date()): Proximity | null {
  const d = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  // Ignore events that have already started (>12h ago).
  if (d.getTime() < now.getTime() - 12 * 3600_000) return null;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfEvent = new Date(d);
  startOfEvent.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfEvent.getTime() - startOfToday.getTime()) / DAY);

  if (dayDiff <= 0) return { label: "Today", urgent: true };
  if (dayDiff === 1) return { label: "Tomorrow", urgent: true };

  const dow = d.getDay(); // 0 Sun … 6 Sat
  if (dayDiff <= 6 && (dow === 6 || dow === 0)) return { label: "This weekend", urgent: false };
  if (dayDiff <= 7) return { label: `In ${dayDiff} days`, urgent: false };
  return null;
}

// Remaining spaces, or null when the event has no capacity limit.
export function spacesLeft(capacity: number | null | undefined, attendees: number): number | null {
  if (!capacity || capacity <= 0) return null;
  return Math.max(0, capacity - attendees);
}

// True only when an event with a real cap is genuinely close to full.
export function isFillingUp(capacity: number | null | undefined, attendees: number): boolean {
  const left = spacesLeft(capacity, attendees);
  if (left === null) return false;
  return left > 0 && left <= Math.max(5, Math.ceil((capacity as number) * 0.15));
}
