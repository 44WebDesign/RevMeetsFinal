import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminUserSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const data = adminUserSchema.parse(await req.json());

  if (id === admin.id && (data.suspended || data.role === "ENTHUSIAST")) {
    return fail("You can't suspend or demote your own admin account", 400);
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.suspended !== undefined ? { suspended: data.suspended } : {}),
    },
  });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  if (id === admin.id) return fail("You can't delete your own account here", 400);
  await prisma.user.delete({ where: { id } });
  return ok({ ok: true });
});
