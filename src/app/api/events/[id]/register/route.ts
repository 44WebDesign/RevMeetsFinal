import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Register (attend) an event.
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return fail("Event not found", 404);

  if (event.capacity && event._count.registrations >= event.capacity) {
    const already = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: id } },
    });
    if (!already) return fail("This event is full", 409);
  }

  await prisma.registration.upsert({
    where: { userId_eventId: { userId: user.id, eventId: id } },
    create: { userId: user.id, eventId: id },
    update: {},
  });

  const count = await prisma.registration.count({ where: { eventId: id } });
  return ok({ registered: true, attendees: count });
});

// Cancel a registration.
export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  await prisma.registration.deleteMany({ where: { userId: user.id, eventId: id } });
  const count = await prisma.registration.count({ where: { eventId: id } });
  return ok({ registered: false, attendees: count });
});
