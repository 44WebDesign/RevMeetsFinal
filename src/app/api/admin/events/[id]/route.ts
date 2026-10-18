import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminEventSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

type Ctx = { params: Promise<{ id: string }> };

// Moderate an event: change status (hide/publish/cancel) or override featured.
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
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
  const parts: string[] = [];
  if (data.status !== undefined) parts.push(`status → ${data.status}`);
  if (data.featured !== undefined) parts.push(data.featured ? "featured" : "unfeatured");
  await logAdmin(admin, { action: "EVENT_UPDATE", targetType: "EVENT", targetId: id, detail: parts.join(", ") });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const target = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  await prisma.event.delete({ where: { id } });
  await logAdmin(admin, { action: "EVENT_DELETE", targetType: "EVENT", targetId: id, detail: target?.title ?? undefined });
  return ok({ ok: true });
});
