import { prisma } from "@/lib/prisma";
import {
  verifyPasswordResetToken,
  hashPassword,
  createSession,
} from "@/lib/auth";
import { resetSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import type { Role } from "@/lib/enums";

export const POST = handle(async (req: Request) => {
  const { token, password } = resetSchema.parse(await req.json());

  const result = await verifyPasswordResetToken(token);
  if (!result) {
    return fail("This reset link is invalid or has expired. Request a new one.", 400);
  }

  const user = await prisma.user.update({
    where: { id: result.userId },
    data: { passwordHash: await hashPassword(password) },
  });

  // Log them straight in.
  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  });

  return ok({ ok: true });
});
