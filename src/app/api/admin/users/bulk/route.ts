import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  action: z.enum(["suspend", "unsuspend", "delete"]),
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const { ids, action } = schema.parse(await req.json());
  // Never act on your own admin account in a bulk operation.
  const targets = ids.filter((id) => id !== admin.id);
  const where = { id: { in: targets } };

  let count = 0;
  if (targets.length > 0) {
    if (action === "delete") {
      count = (await prisma.user.deleteMany({ where })).count;
    } else {
      count = (await prisma.user.updateMany({ where, data: { suspended: action === "suspend" } })).count;
    }
  }

  await logAdmin(admin, { action: "USER_BULK", targetType: "USER", detail: `${action} × ${count}` });
  return ok({ ok: true, count, skippedSelf: targets.length !== ids.length });
});
