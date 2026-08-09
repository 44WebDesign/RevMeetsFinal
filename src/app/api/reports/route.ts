import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";

// Submit a moderation report against an event or review. Requires login (cuts
// spam). De-duplicates: one open report per user per target.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const data = reportSchema.parse(await req.json());

  const existing = await prisma.report.findFirst({
    where: {
      reporterId: user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      status: "OPEN",
    },
  });
  if (existing) return ok({ reported: true, duplicate: true });

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      detail: data.detail || null,
    },
  });

  return ok({ reported: true }, 201);
});
