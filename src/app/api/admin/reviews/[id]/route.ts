import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await prisma.review.deleteMany({ where: { id } });
  return ok({ ok: true });
});
