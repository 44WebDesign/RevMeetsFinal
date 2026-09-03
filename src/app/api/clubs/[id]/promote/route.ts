import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { stripeConfigured } from "@/lib/stripe";
import { createFeaturedCheckout } from "@/lib/promotions";
import { appOrigin } from "@/lib/google";

type Ctx = { params: Promise<{ id: string }> };

// Start a Stripe Checkout session to feature (promote) a club.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  if (!stripeConfigured()) {
    return fail("Paid promotion isn't set up on this site yet.", 501);
  }

  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) return fail("Club not found", 404);
  if (club.ownerId !== user.id && user.role !== "ADMIN") {
    return fail("You do not own this club", 403);
  }

  const url = await createFeaturedCheckout({
    targetType: "CLUB",
    targetId: club.id,
    title: club.name,
    userId: user.id,
    origin: appOrigin(req),
    cancelUrl: `${appOrigin(req)}/dashboard/club?promote=cancelled`,
  });

  return ok({ url });
});
