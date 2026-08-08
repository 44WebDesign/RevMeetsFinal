import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Toggle saving/bookmarking an event for later.
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: id } },
  });

  if (existing) {
    await prisma.savedEvent.delete({ where: { id: existing.id } });
    return ok({ saved: false });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return fail("Event not found", 404);
  await prisma.savedEvent.create({ data: { userId: user.id, eventId: id } });
  return ok({ saved: true });
});
