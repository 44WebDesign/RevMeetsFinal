import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

// Database-backed checks. Requires DATABASE_URL pointing at a Postgres with the
// schema pushed (see the CI workflow / README). Run: npm run test:integration
const prisma = new PrismaClient();
const tag = `it${Date.now()}`;

beforeAll(async () => {
  await prisma.$connect();
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("reviews across targets", () => {
  it("allows one review per user for an event, a club and a venue", async () => {
    const host = await prisma.user.create({ data: { email: `${tag}-host@t.com`, name: "Host", role: "ORGANISER" } });
    const fan = await prisma.user.create({ data: { email: `${tag}-fan@t.com`, name: "Fan", role: "ENTHUSIAST" } });
    const club = await prisma.club.create({ data: { ownerId: host.id, name: "C", slug: `${tag}-c`, description: "d", location: "L" } });
    const venue = await prisma.venue.create({ data: { ownerId: host.id, name: "V", slug: `${tag}-v`, description: "d", address: "a", city: "London", lat: 51.5, lng: -0.1 } });
    const event = await prisma.event.create({ data: { title: "E", slug: `${tag}-e`, description: "d", type: "MEET", startsAt: new Date(Date.now() - 1000), city: "London", lat: 51.5, lng: -0.1, organiserId: host.id } });

    await prisma.review.create({ data: { userId: fan.id, eventId: event.id, rating: 5 } });
    await prisma.review.create({ data: { userId: fan.id, clubId: club.id, rating: 4 } });
    await prisma.review.create({ data: { userId: fan.id, venueId: venue.id, rating: 3 } });

    expect(await prisma.review.count({ where: { userId: fan.id } })).toBe(3);

    // Event uniqueness still enforced at the DB level.
    await expect(
      prisma.review.create({ data: { userId: fan.id, eventId: event.id, rating: 1 } }),
    ).rejects.toThrow();
  });
});

describe("photo moderation", () => {
  it("reports and deletes a photo", async () => {
    const u = await prisma.user.create({ data: { email: `${tag}-pu@t.com`, name: "U", role: "ENTHUSIAST" } });
    const photo = await prisma.photo.create({ data: { uploaderId: u.id, url: "https://x/p.jpg", caption: "c" } });
    await prisma.report.create({ data: { reporterId: u.id, targetType: "PHOTO", targetId: photo.id, reason: "Spam or misleading" } });

    expect(await prisma.report.count({ where: { targetType: "PHOTO", targetId: photo.id } })).toBe(1);
    await prisma.photo.delete({ where: { id: photo.id } });
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();
  });
});

describe("digest user fields", () => {
  it("persists home location + opt-in and filters eligible users", async () => {
    const optedIn = await prisma.user.create({
      data: { email: `${tag}-din@t.com`, name: "In", role: "ENTHUSIAST", homeLat: 51.5, homeLng: -0.1, homeCity: "London", digestOptIn: true },
    });
    await prisma.user.create({
      data: { email: `${tag}-dout@t.com`, name: "Out", role: "ENTHUSIAST", digestOptIn: false },
    });

    const eligible = await prisma.user.findMany({
      where: { digestOptIn: true, suspended: false, email: { startsWith: `${tag}-d` } },
    });
    expect(eligible.map((u) => u.id)).toContain(optedIn.id);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].homeCity).toBe("London");
  });
});
