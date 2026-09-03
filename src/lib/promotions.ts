import type Stripe from "stripe";
import { prisma } from "./prisma";
import { getStripe, featuredPricePence, featuredDays } from "./stripe";

// Paid featured placement can target an event, a club or a venue. The shared
// checkout + apply logic below keeps all three consistent and idempotent.

export type PromoTarget = "EVENT" | "CLUB" | "VENUE";

const TARGETS: Record<PromoTarget, { noun: string; hrefBase: string }> = {
  EVENT: { noun: "event", hrefBase: "/events" },
  CLUB: { noun: "club", hrefBase: "/clubs" },
  VENUE: { noun: "venue", hrefBase: "/venues" },
};

// Start a Stripe Checkout session to feature a target. Returns the checkout URL.
export async function createFeaturedCheckout(opts: {
  targetType: PromoTarget;
  targetId: string;
  title: string;
  userId: string;
  origin: string;
  cancelUrl: string;
}): Promise<string | null> {
  const days = featuredDays();
  const noun = TARGETS[opts.targetType].noun;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: featuredPricePence(),
          product_data: {
            name: `Featured placement — ${opts.title}`,
            description: `Promotes your ${noun} for ${days} days: it sorts first in listings and gets a Featured badge.`,
          },
        },
      },
    ],
    metadata: {
      targetType: opts.targetType,
      targetId: opts.targetId,
      userId: opts.userId,
      days: String(days),
    },
    success_url: `${opts.origin}/api/stripe/featured-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: opts.cancelUrl,
  });

  return session.url;
}

// Read the target of a checkout session, tolerating the legacy `eventId`
// metadata shape from before promotions were generalised.
function readTarget(session: Stripe.Checkout.Session): { type: PromoTarget; id: string } | null {
  const md = session.metadata ?? {};
  if (md.targetType && md.targetId && md.targetType in TARGETS) {
    return { type: md.targetType as PromoTarget, id: md.targetId };
  }
  if (md.eventId) return { type: "EVENT", id: md.eventId }; // legacy sessions
  return null;
}

async function slugFor(type: PromoTarget, id: string): Promise<string | null> {
  if (type === "EVENT") return (await prisma.event.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? null;
  if (type === "CLUB") return (await prisma.club.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? null;
  return (await prisma.venue.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? null;
}

// Apply a paid featured promotion from a completed Stripe Checkout session.
// Idempotent: keyed on the Stripe session id, so the success redirect and the
// webhook can both call it safely (whichever arrives first wins). Returns the
// path to redirect the buyer to.
export async function applyPromotionFromSession(
  session: Stripe.Checkout.Session,
): Promise<{ redirect: string } | null> {
  if (session.payment_status !== "paid") return null;

  const target = readTarget(session);
  const userId = session.metadata?.userId;
  const days = Number(session.metadata?.days ?? String(featuredDays()));
  if (!target || !userId) return null;

  const hrefBase = TARGETS[target.type].hrefBase;

  // Already recorded? Just return where to send the buyer.
  const existing = await prisma.promotion.findUnique({
    where: { stripeSessionId: session.id },
    include: {
      event: { select: { slug: true } },
      club: { select: { slug: true } },
      venue: { select: { slug: true } },
    },
  });
  if (existing) {
    const slug = existing.event?.slug ?? existing.club?.slug ?? existing.venue?.slug;
    return slug ? { redirect: `${hrefBase}/${slug}?promoted=1` } : { redirect: "/dashboard/promotions" };
  }

  // Load the current featuredUntil so we extend rather than shorten.
  let currentUntil: Date | null = null;
  if (target.type === "EVENT") currentUntil = (await prisma.event.findUnique({ where: { id: target.id }, select: { featuredUntil: true } }))?.featuredUntil ?? null;
  else if (target.type === "CLUB") currentUntil = (await prisma.club.findUnique({ where: { id: target.id }, select: { featuredUntil: true } }))?.featuredUntil ?? null;
  else currentUntil = (await prisma.venue.findUnique({ where: { id: target.id }, select: { featuredUntil: true } }))?.featuredUntil ?? null;

  const slug = await slugFor(target.type, target.id);
  if (slug === null) return null; // target no longer exists

  const base = currentUntil && currentUntil > new Date() ? currentUntil : new Date();
  const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const promoData = {
    userId,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "gbp",
    days,
    stripeSessionId: session.id,
    expiresAt,
    ...(target.type === "EVENT" ? { eventId: target.id } : {}),
    ...(target.type === "CLUB" ? { clubId: target.id } : {}),
    ...(target.type === "VENUE" ? { venueId: target.id } : {}),
  };

  const featuredUpdate = { featured: true, featuredUntil: expiresAt };
  await prisma.$transaction([
    target.type === "EVENT"
      ? prisma.event.update({ where: { id: target.id }, data: featuredUpdate })
      : target.type === "CLUB"
        ? prisma.club.update({ where: { id: target.id }, data: featuredUpdate })
        : prisma.venue.update({ where: { id: target.id }, data: featuredUpdate }),
    prisma.promotion.create({ data: promoData }),
  ]);

  return { redirect: `${hrefBase}/${slug}?promoted=1` };
}

export type HostPromotion = {
  id: string;
  amount: number;
  currency: string;
  days: number;
  createdAt: Date;
  expiresAt: Date;
  live: boolean;
  kind: PromoTarget;
  title: string;
  href: string | null;
};

export async function getHostPromotions(userId: string): Promise<HostPromotion[]> {
  const rows = await prisma.promotion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { slug: true, title: true } },
      club: { select: { slug: true, name: true } },
      venue: { select: { slug: true, name: true } },
    },
  });

  return rows.map((p) => {
    const kind: PromoTarget = p.eventId ? "EVENT" : p.clubId ? "CLUB" : "VENUE";
    const title = p.event?.title ?? p.club?.name ?? p.venue?.name ?? "(deleted)";
    const slug = p.event?.slug ?? p.club?.slug ?? p.venue?.slug ?? null;
    const href = slug ? `${TARGETS[kind].hrefBase}/${slug}` : null;
    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      days: p.days,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      live: p.expiresAt > new Date(),
      kind,
      title,
      href,
    };
  });
}

// Expire lapsed featured placements across all target types (called by cron).
export async function expireFeatured(now: Date = new Date()): Promise<number> {
  const [e, c, v] = await prisma.$transaction([
    prisma.event.updateMany({ where: { featured: true, featuredUntil: { lt: now } }, data: { featured: false } }),
    prisma.club.updateMany({ where: { featured: true, featuredUntil: { lt: now } }, data: { featured: false } }),
    prisma.venue.updateMany({ where: { featured: true, featuredUntil: { lt: now } }, data: { featured: false } }),
  ]);
  return e.count + c.count + v.count;
}
