import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminUserSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

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
  const parts: string[] = [];
  if (data.role !== undefined) parts.push(`role → ${data.role}`);
  if (data.suspended !== undefined) parts.push(data.suspended ? "suspended" : "unsuspended");
  await logAdmin(admin, { action: "USER_UPDATE", targetType: "USER", targetId: id, detail: parts.join(", ") });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  if (id === admin.id) return fail("You can't delete your own account here", 400);
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  await prisma.user.delete({ where: { id } });
  await logAdmin(admin, { action: "USER_DELETE", targetType: "USER", targetId: id, detail: target?.email ?? undefined });
  return ok({ ok: true });
});
