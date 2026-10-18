import { prisma } from "@/lib/prisma";
import { requireUser, destroySession } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// Self-service account deletion (GDPR right to erasure). Removes the account and
// cascades to the user's own content, then clears the session.
export const DELETE = handle(async () => {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return ok({ ok: true });
});
