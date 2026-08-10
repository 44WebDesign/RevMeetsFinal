import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(1000).optional().nullable(),
});

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const reviews = await prisma.review.findMany({
    where: { venueId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, avatarColor: true } } },
  });
  return ok({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
      author: r.user.name,
      avatarColor: r.user.avatarColor,
    })),
  });
});

// Create or update the caller's review of a venue. Any signed-in member can
// review a venue — except its owner.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const data = reviewSchema.parse(await req.json());

  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) return fail("Venue not found", 404);
  if (venue.ownerId === user.id) {
    return fail("You can't review your own venue", 400);
  }

  const existing = await prisma.review.findUnique({
    where: { userId_venueId: { userId: user.id, venueId: id } },
  });
  const review = await prisma.review.upsert({
    where: { userId_venueId: { userId: user.id, venueId: id } },
    create: { userId: user.id, venueId: id, rating: data.rating, body: data.body || null },
    update: { rating: data.rating, body: data.body || null },
  });

  if (!existing) {
    await notify({
      userId: venue.ownerId,
      type: "REVIEW",
      message: `${user.name} left a ${data.rating}★ review on ${venue.name}`,
      link: `/venues/${venue.slug}`,
    });
  }

  return ok({ id: review.id }, 201);
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await prisma.review.deleteMany({ where: { userId: user.id, venueId: id } });
  return ok({ ok: true });
});
