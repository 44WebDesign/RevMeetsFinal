import { prisma } from "@/lib/prisma";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

// Change / set the signed-in user's password. Accounts that already have a
// password must supply the current one; Google-only accounts (no password
// yet) can set one without it.
export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json());

  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return fail("Your current password is incorrect", 400);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return ok({ ok: true });
});
