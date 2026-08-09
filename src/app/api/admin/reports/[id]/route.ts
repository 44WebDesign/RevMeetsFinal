import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminReportSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Update a report's status (resolve / dismiss / reopen).
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { status } = adminReportSchema.parse(await req.json());

  await prisma.report.update({
    where: { id },
    data: { status, resolvedAt: status === "OPEN" ? null : new Date() },
  });
  return ok({ ok: true });
});
