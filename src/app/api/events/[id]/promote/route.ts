import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import {
  getStripe,
  stripeConfigured,
  featuredPricePence,
  featuredDays,
} from "@/lib/stripe";
import { appOrigin } from "@/lib/google";

type Ctx = { params: Promise<{ id: string }> };

// Start a Stripe Checkout session to feature (promote) an event.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  if (!stripeConfigured()) {
    return fail("Paid promotion isn't set up on this site yet.", 501);
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return fail("Event not found", 404);
  if (event.organiserId !== user.id && user.role !== "ADMIN") {
    return fail("You do not own this event", 403);
  }

  const days = featuredDays();
  const origin = appOrigin(req);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: featuredPricePence(),
          product_data: {
            name: `Featured placement — ${event.title}`,
            description: `Promotes your event for ${days} days: it sorts first in listings and gets a Featured badge.`,
          },
        },
      },
    ],
    metadata: { eventId: event.id, userId: user.id, days: String(days) },
    success_url: `${origin}/api/stripe/featured-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/events/${event.id}/edit?promote=cancelled`,
  });

  return ok({ url: session.url });
});
