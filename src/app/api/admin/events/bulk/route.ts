import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  action: z.enum(["publish", "draft", "cancel", "unfeature", "delete"]),
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const { ids, action } = schema.parse(await req.json());
  const where = { id: { in: ids } };

  let count = 0;
  if (action === "delete") {
    count = (await prisma.event.deleteMany({ where })).count;
  } else if (action === "unfeature") {
    count = (await prisma.event.updateMany({ where, data: { featured: false, featuredUntil: null } })).count;
  } else {
    const status = action === "publish" ? "PUBLISHED" : action === "draft" ? "DRAFT" : "CANCELLED";
    count = (await prisma.event.updateMany({ where, data: { status } })).count;
  }

  await logAdmin(admin, { action: "EVENT_BULK", targetType: "EVENT", detail: `${action} × ${count}` });
  return ok({ ok: true, count });
});
