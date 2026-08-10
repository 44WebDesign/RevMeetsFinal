import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

const schema = z.object({ id: z.string().optional() });

// Mark one notification read (with { id }), or all of the caller's if no id.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const { id } = schema.parse(body);

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });

  return ok({ ok: true });
});
