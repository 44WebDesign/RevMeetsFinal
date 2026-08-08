import type Stripe from "stripe";
import { prisma } from "./prisma";

// Apply a paid featured promotion from a completed Stripe Checkout session.
// Idempotent: keyed on the Stripe session id, so the success redirect and the
// webhook can both call it safely (whichever arrives first wins).
export async function applyPromotionFromSession(
  session: Stripe.Checkout.Session,
): Promise<{ eventSlug: string } | null> {
  if (session.payment_status !== "paid") return null;

  const eventId = session.metadata?.eventId;
  const userId = session.metadata?.userId;
  const days = Number(session.metadata?.days ?? "30");
  if (!eventId || !userId) return null;

  // Already recorded? Return the event slug and do nothing else.
  const existing = await prisma.promotion.findUnique({
    where: { stripeSessionId: session.id },
    include: { event: { select: { slug: true } } },
  });
  if (existing) return { eventSlug: existing.event.slug };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;

  // Extend from the later of now / current expiry.
  const base =
    event.featuredUntil && event.featuredUntil > new Date() ? event.featuredUntil : new Date();
  const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { featured: true, featuredUntil: expiresAt },
    }),
    prisma.promotion.create({
      data: {
        eventId,
        userId,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? "gbp",
        days,
        stripeSessionId: session.id,
        expiresAt,
      },
    }),
  ]);

  return { eventSlug: event.slug };
}

export async function getHostPromotions(userId: string) {
  return prisma.promotion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { event: { select: { slug: true, title: true, featured: true, featuredUntil: true } } },
  });
}
