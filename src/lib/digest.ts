import { distanceKm } from "./utils";

// Pure selection/ranking for the weekly "events near you" digest. Kept free of
// Prisma/Next so it can be unit-tested with plain objects; the cron route feeds
// it rows it has already fetched.

export type DigestCandidate = {
  id: string;
  title: string;
  slug: string;
  city: string;
  region?: string | null; // used for the area-text match in the newsletter digest
  lat: number;
  lng: number;
  startsAt: Date;
  clubId: string | null;
  venueId: string | null;
  featured?: boolean; // currently a paid featured event → sponsored top slot
};

export type DigestContext = {
  homeLat: number | null;
  homeLng: number | null;
  followedClubIds: string[];
  followedVenueIds: string[];
  engagedCities: string[]; // cities the user has registered for / saved, lower-cased
  radiusKm?: number; // default 80
  limit?: number; // default 8
  maxFeatured?: number; // cap on sponsored top slots (default 2)
};

export type DigestPick = {
  id: string;
  title: string;
  slug: string;
  city: string;
  startsAt: Date;
  distanceKm: number | null;
  reason: "featured" | "following" | "near" | "city";
};

// Returns the events worth emailing this user, best-first, or [] when there's
// nothing to personalise on (no home location, no follows, no engaged cities).
export function rankEventsForUser(
  candidates: DigestCandidate[],
  ctx: DigestContext,
): DigestPick[] {
  const radiusKm = ctx.radiusKm ?? 80;
  const limit = ctx.limit ?? 8;
  const maxFeatured = ctx.maxFeatured ?? 2;
  const hasHome = ctx.homeLat !== null && ctx.homeLng !== null;
  const clubs = new Set(ctx.followedClubIds);
  const venues = new Set(ctx.followedVenueIds);
  const cities = new Set(ctx.engagedCities.map((c) => c.toLowerCase()));

  if (!hasHome && clubs.size === 0 && venues.size === 0 && cities.size === 0) {
    return [];
  }

  const picks: DigestPick[] = [];
  for (const e of candidates) {
    const following = (e.clubId && clubs.has(e.clubId)) || (e.venueId && venues.has(e.venueId));
    const dist = hasHome ? distanceKm(ctx.homeLat!, ctx.homeLng!, e.lat, e.lng) : null;
    const near = dist !== null && dist <= radiusKm;
    const inCity = cities.has(e.city.toLowerCase());

    if (!following && !near && !inCity) continue;

    // A paid featured event that's *also* relevant earns the sponsored top slot;
    // featured events that aren't near/followed/in-city never appear (no spam).
    const reason: DigestPick["reason"] = e.featured
      ? "featured"
      : following
        ? "following"
        : near
          ? "near"
          : "city";

    picks.push({
      id: e.id,
      title: e.title,
      slug: e.slug,
      city: e.city,
      startsAt: e.startsAt,
      distanceKm: dist,
      reason,
    });
  }

  const reasonRank = { featured: 0, following: 1, near: 2, city: 3 } as const;
  picks.sort((a, b) => {
    if (reasonRank[a.reason] !== reasonRank[b.reason]) {
      return reasonRank[a.reason] - reasonRank[b.reason];
    }
    // Within the same reason: nearest first when we have distances, else soonest.
    if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    return a.startsAt.getTime() - b.startsAt.getTime();
  });

  // Cap the number of sponsored (featured) slots so they can't fill the digest.
  const featured = picks.filter((p) => p.reason === "featured").slice(0, maxFeatured);
  const rest = picks.filter((p) => p.reason !== "featured");
  return [...featured, ...rest].slice(0, limit);
}

// Selection for the anonymous "events near you" newsletter list. Subscribers
// only give us a free-text area (town / postcode / region), so we match on that
// text against each event's city/region. When an area is given but matches
// nothing (or no area at all), we fall back to the soonest events UK-wide so
// the email is never empty. Featured events sort first (sponsored slot),
// everything else by soonest date. Pure + synchronous for easy unit testing.
export function pickNewsletterEvents(
  candidates: DigestCandidate[],
  area: string | null | undefined,
  limit = 6,
): DigestCandidate[] {
  const byRank = (a: DigestCandidate, b: DigestCandidate) => {
    const fa = a.featured ? 0 : 1;
    const fb = b.featured ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return a.startsAt.getTime() - b.startsAt.getTime();
  };

  const q = area?.trim().toLowerCase() ?? "";
  if (q) {
    const matched = candidates.filter((e) => {
      const hay = `${e.city} ${e.region ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (matched.length > 0) return [...matched].sort(byRank).slice(0, limit);
  }

  // No area, or nothing matched → soonest UK-wide (featured first).
  return [...candidates].sort(byRank).slice(0, limit);
}
