import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminReportSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

type Ctx = { params: Promise<{ id: string }> };

// Update a report's status (resolve / dismiss / reopen).
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { status } = adminReportSchema.parse(await req.json());

  await prisma.report.update({
    where: { id },
    data: { status, resolvedAt: status === "OPEN" ? null : new Date() },
  });
  await logAdmin(admin, { action: "REPORT_UPDATE", targetType: "REPORT", targetId: id, detail: `status → ${status}` });
  return ok({ ok: true });
});
