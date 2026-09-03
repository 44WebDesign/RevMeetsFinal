// Pure helpers for the "recently viewed events" list. The list itself lives in
// the viewer's browser (localStorage) — this module just keeps the ordering,
// de-duplication and cap logic testable and out of the component.

export type RecentEvent = {
  slug: string;
  title: string;
  city: string;
  type: string;
  startsAt: string; // ISO
  imageUrl?: string | null;
};

export const RECENT_KEY = "revmeet_recent_events";
export const RECENT_CAP = 10;

// Prepend an event, drop any earlier entry for the same slug, and cap the list.
export function addRecent(list: RecentEvent[], ev: RecentEvent, cap = RECENT_CAP): RecentEvent[] {
  const withoutDupe = list.filter((e) => e.slug !== ev.slug);
  return [ev, ...withoutDupe].slice(0, cap);
}

// Defensive parse of whatever is in storage — always returns a clean array.
export function parseRecent(raw: string | null): RecentEvent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentEvent =>
        e && typeof e.slug === "string" && typeof e.title === "string" && typeof e.startsAt === "string",
    );
  } catch {
    return [];
  }
}
