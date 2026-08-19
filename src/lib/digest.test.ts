import { describe, it, expect } from "vitest";
import { rankEventsForUser, type DigestCandidate, type DigestContext } from "./digest";

const LONDON = { lat: 51.5074, lng: -0.1278 };
const READING = { lat: 51.4543, lng: -0.9781 }; // ~60km W of London
const LEEDS = { lat: 53.8008, lng: -1.5491 }; // ~270km N

function ev(id: string, coords: { lat: number; lng: number }, extra: Partial<DigestCandidate> = {}): DigestCandidate {
  return {
    id,
    title: `Event ${id}`,
    slug: `event-${id}`,
    city: extra.city ?? "Somewhere",
    lat: coords.lat,
    lng: coords.lng,
    startsAt: extra.startsAt ?? new Date("2026-09-01T09:00:00Z"),
    clubId: extra.clubId ?? null,
    venueId: extra.venueId ?? null,
  };
}

describe("rankEventsForUser", () => {
  it("returns nothing when there's nothing to personalise on", () => {
    const ctx: DigestContext = { homeLat: null, homeLng: null, followedClubIds: [], followedVenueIds: [], engagedCities: [] };
    expect(rankEventsForUser([ev("a", LONDON)], ctx)).toEqual([]);
  });

  it("includes events within the home radius and excludes far ones", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: [], followedVenueIds: [], engagedCities: [], radiusKm: 80 };
    const picks = rankEventsForUser([ev("near", READING), ev("far", LEEDS)], ctx);
    expect(picks.map((p) => p.id)).toEqual(["near"]);
    expect(picks[0].reason).toBe("near");
  });

  it("prioritises followed clubs/venues above merely-near events", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: ["c1"], followedVenueIds: [], engagedCities: [], radiusKm: 80 };
    const near = ev("near", READING);
    const followed = ev("followed", LEEDS, { clubId: "c1" }); // far but followed
    const picks = rankEventsForUser([near, followed], ctx);
    expect(picks.map((p) => p.id)).toEqual(["followed", "near"]);
    expect(picks[0].reason).toBe("following");
  });

  it("matches on engaged cities when there's no home location", () => {
    const ctx: DigestContext = { homeLat: null, homeLng: null, followedClubIds: [], followedVenueIds: [], engagedCities: ["leeds"] };
    const picks = rankEventsForUser([ev("a", LEEDS, { city: "Leeds" }), ev("b", LONDON, { city: "London" })], ctx);
    expect(picks.map((p) => p.id)).toEqual(["a"]);
    expect(picks[0].reason).toBe("city");
  });

  it("city match is case-insensitive", () => {
    const ctx: DigestContext = { homeLat: null, homeLng: null, followedClubIds: [], followedVenueIds: [], engagedCities: ["LeEdS"] };
    expect(rankEventsForUser([ev("a", LEEDS, { city: "leeds" })], ctx)).toHaveLength(1);
  });

  it("sorts nearest-first within the same reason and respects the limit", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: [], followedVenueIds: [], engagedCities: [], radiusKm: 500, limit: 2 };
    const picks = rankEventsForUser([ev("leeds", LEEDS), ev("reading", READING), ev("london", LONDON)], ctx);
    expect(picks).toHaveLength(2);
    expect(picks[0].id).toBe("london"); // closest
    expect(picks[1].id).toBe("reading");
  });
});
