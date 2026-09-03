import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { stripeConfigured } from "@/lib/stripe";
import { createFeaturedCheckout } from "@/lib/promotions";
import { appOrigin } from "@/lib/google";

type Ctx = { params: Promise<{ id: string }> };

// Start a Stripe Checkout session to feature (promote) a venue.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  if (!stripeConfigured()) {
    return fail("Paid promotion isn't set up on this site yet.", 501);
  }

  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) return fail("Venue not found", 404);
  if (venue.ownerId !== user.id && user.role !== "ADMIN") {
    return fail("You do not own this venue", 403);
  }

  const url = await createFeaturedCheckout({
    targetType: "VENUE",
    targetId: venue.id,
    title: venue.name,
    userId: user.id,
    origin: appOrigin(req),
    cancelUrl: `${appOrigin(req)}/dashboard/venue?promote=cancelled`,
  });

  return ok({ url });
});
