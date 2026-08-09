import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminEventSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Moderate an event: change status (hide/publish/cancel) or override featured.
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const data = adminEventSchema.parse(await req.json());

  await prisma.event.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.featured !== undefined
        ? { featured: data.featured, ...(data.featured ? {} : { featuredUntil: null }) }
        : {}),
    },
  });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await prisma.event.delete({ where: { id } });
  return ok({ ok: true });
});
