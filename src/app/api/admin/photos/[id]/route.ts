import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await prisma.photo.deleteMany({ where: { id } });
  await logAdmin(admin, { action: "PHOTO_DELETE", targetType: "PHOTO", targetId: id });
  return ok({ ok: true });
});
