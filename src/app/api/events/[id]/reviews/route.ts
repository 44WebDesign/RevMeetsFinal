import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(1000).optional().nullable(),
});

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const reviews = await prisma.review.findMany({
    where: { eventId: id },
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

// Create or update the caller's review. Attendees only, after the event starts.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const data = reviewSchema.parse(await req.json());

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return fail("Event not found", 404);
  if (event.startsAt > new Date()) {
    return fail("You can review an event once it has started", 400);
  }

  const registered = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: id } },
  });
  if (!registered) {
    return fail("Only attendees can review — register for the event first", 403);
  }

  const review = await prisma.review.upsert({
    where: { userId_eventId: { userId: user.id, eventId: id } },
    create: { userId: user.id, eventId: id, rating: data.rating, body: data.body || null },
    update: { rating: data.rating, body: data.body || null },
  });

  return ok({ id: review.id }, 201);
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await prisma.review.deleteMany({ where: { userId: user.id, eventId: id } });
  return ok({ ok: true });
});
