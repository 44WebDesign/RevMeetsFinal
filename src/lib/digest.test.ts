import { describe, it, expect } from "vitest";
import {
  rankEventsForUser,
  pickNewsletterEvents,
  type DigestCandidate,
  type DigestContext,
} from "./digest";

const LONDON = { lat: 51.5074, lng: -0.1278 };
const READING = { lat: 51.4543, lng: -0.9781 }; // ~60km W of London
const LEEDS = { lat: 53.8008, lng: -1.5491 }; // ~270km N

function ev(id: string, coords: { lat: number; lng: number }, extra: Partial<DigestCandidate> = {}): DigestCandidate {
  return {
    id,
    title: `Event ${id}`,
    slug: `event-${id}`,
    city: extra.city ?? "Somewhere",
    region: extra.region ?? null,
    lat: coords.lat,
    lng: coords.lng,
    startsAt: extra.startsAt ?? new Date("2026-09-01T09:00:00Z"),
    clubId: extra.clubId ?? null,
    venueId: extra.venueId ?? null,
    featured: extra.featured ?? false,
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

  it("gives a relevant featured event the sponsored top slot", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: [], followedVenueIds: [], engagedCities: [], radiusKm: 80 };
    const near = ev("near", READING);
    const sponsored = ev("sponsored", READING, { featured: true } as Partial<DigestCandidate>);
    const picks = rankEventsForUser([near, sponsored], ctx);
    expect(picks[0].id).toBe("sponsored");
    expect(picks[0].reason).toBe("featured");
  });

  it("never shows a featured event that isn't relevant to the user", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: [], followedVenueIds: [], engagedCities: [], radiusKm: 80 };
    const farSponsored = ev("far", LEEDS, { featured: true } as Partial<DigestCandidate>);
    expect(rankEventsForUser([farSponsored], ctx)).toEqual([]);
  });

  it("caps the number of sponsored slots", () => {
    const ctx: DigestContext = { homeLat: LONDON.lat, homeLng: LONDON.lng, followedClubIds: [], followedVenueIds: [], engagedCities: [], radiusKm: 80, maxFeatured: 1 };
    const picks = rankEventsForUser(
      [
        ev("f1", LONDON, { featured: true } as Partial<DigestCandidate>),
        ev("f2", READING, { featured: true } as Partial<DigestCandidate>),
        ev("plain", LONDON),
      ],
      ctx,
    );
    expect(picks.filter((p) => p.reason === "featured")).toHaveLength(1);
    expect(picks.some((p) => p.id === "plain")).toBe(true);
  });
});

describe("pickNewsletterEvents", () => {
  const soon = new Date("2026-09-01T09:00:00Z");
  const later = new Date("2026-09-20T09:00:00Z");

  it("matches the subscriber's area against city/region (case-insensitive)", () => {
    const list = [
      ev("leeds", LEEDS, { city: "Leeds" }),
      ev("london", LONDON, { city: "London" }),
    ];
    const picks = pickNewsletterEvents(list, "leeds", 6);
    expect(picks.map((p) => p.id)).toEqual(["leeds"]);
  });

  it("matches on region text too", () => {
    const list = [
      ev("a", LEEDS, { city: "Harrogate", region: "Yorkshire" }),
      ev("b", LONDON, { city: "London", region: "Greater London" }),
    ];
    expect(pickNewsletterEvents(list, "yorkshire", 6).map((p) => p.id)).toEqual(["a"]);
  });

  it("falls back to soonest UK-wide when the area matches nothing", () => {
    const list = [
      ev("late", LONDON, { city: "London", startsAt: later }),
      ev("early", LEEDS, { city: "Leeds", startsAt: soon }),
    ];
    const picks = pickNewsletterEvents(list, "nowhere-ville", 6);
    expect(picks.map((p) => p.id)).toEqual(["early", "late"]); // soonest first
  });

  it("with no area, returns soonest UK-wide with featured first", () => {
    const list = [
      ev("plain-early", LEEDS, { startsAt: soon }),
      ev("featured-late", LONDON, { startsAt: later, featured: true } as Partial<DigestCandidate>),
    ];
    const picks = pickNewsletterEvents(list, null, 6);
    expect(picks[0].id).toBe("featured-late"); // featured sponsored slot wins
  });

  it("respects the limit", () => {
    const list = [ev("a", LONDON), ev("b", READING), ev("c", LEEDS)];
    expect(pickNewsletterEvents(list, null, 2)).toHaveLength(2);
  });
});
