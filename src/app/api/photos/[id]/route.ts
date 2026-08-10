import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Delete a photo — the uploader or an admin.
export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return fail("Photo not found", 404);
  if (photo.uploaderId !== user.id && user.role !== "ADMIN") {
    return fail("You can only delete your own photos", 403);
  }

  await prisma.photo.delete({ where: { id } });
  return ok({ ok: true });
});
