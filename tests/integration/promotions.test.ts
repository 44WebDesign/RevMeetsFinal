import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { applyPromotionFromSession, expireFeatured } from "@/lib/promotions";

const prisma = new PrismaClient();
const tag = `promo${Date.now()}`;

beforeAll(async () => prisma.$connect());
afterAll(async () => prisma.$disconnect());

// Build a minimal paid Checkout session targeting a club/venue/event.
function session(id: string, meta: Record<string, string>): Stripe.Checkout.Session {
  return {
    id,
    payment_status: "paid",
    amount_total: 999,
    currency: "gbp",
    metadata: meta,
  } as unknown as Stripe.Checkout.Session;
}

describe("applyPromotionFromSession", () => {
  it("features a club, is idempotent, and expireFeatured reverses it", async () => {
    const owner = await prisma.user.create({ data: { email: `${tag}-o@t.com`, name: "O", role: "ORGANISER" } });
    const club = await prisma.club.create({ data: { ownerId: owner.id, name: "C", slug: `${tag}-c`, description: "d", location: "L" } });

    const res = await applyPromotionFromSession(session(`${tag}-s1`, { targetType: "CLUB", targetId: club.id, userId: owner.id, days: "30" }));
    expect(res?.redirect).toBe(`/clubs/${tag}-c?promoted=1`);

    const featured = await prisma.club.findUnique({ where: { id: club.id } });
    expect(featured!.featured).toBe(true);
    expect(featured!.featuredUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(await prisma.promotion.count({ where: { clubId: club.id } })).toBe(1);

    // Same session id again → no duplicate promotion row.
    await applyPromotionFromSession(session(`${tag}-s1`, { targetType: "CLUB", targetId: club.id, userId: owner.id, days: "30" }));
    expect(await prisma.promotion.count({ where: { clubId: club.id } })).toBe(1);

    // Expiring at a far-future "now" clears the featured flag.
    const future = new Date(Date.now() + 1000 * 24 * 3600 * 1000);
    await expireFeatured(future);
    expect((await prisma.club.findUnique({ where: { id: club.id } }))!.featured).toBe(false);
  });

  it("ignores unpaid sessions", async () => {
    const s = { id: `${tag}-unpaid`, payment_status: "unpaid", metadata: { targetType: "CLUB", targetId: "x", userId: "y" } } as unknown as Stripe.Checkout.Session;
    expect(await applyPromotionFromSession(s)).toBeNull();
  });

  it("supports the legacy eventId metadata shape", async () => {
    const owner = await prisma.user.create({ data: { email: `${tag}-e@t.com`, name: "E", role: "ORGANISER" } });
    const event = await prisma.event.create({ data: { title: "E", slug: `${tag}-e`, description: "d", type: "MEET", startsAt: new Date(), city: "London", lat: 51.5, lng: -0.1, organiserId: owner.id } });
    const res = await applyPromotionFromSession(session(`${tag}-s2`, { eventId: event.id, userId: owner.id, days: "30" }));
    expect(res?.redirect).toBe(`/events/${tag}-e?promoted=1`);
    expect((await prisma.event.findUnique({ where: { id: event.id } }))!.featured).toBe(true);
  });
});
