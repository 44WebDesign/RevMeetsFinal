import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import type { Role } from "@/lib/enums";

export const POST = handle(async (req: Request) => {
  const body = await req.json();
  const data = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (user && !user.passwordHash) {
    return fail("This account uses Google sign-in — use the Google button instead.", 401);
  }
  if (!user || !user.passwordHash || !(await verifyPassword(data.password, user.passwordHash))) {
    return fail("Invalid email or password", 401);
  }

  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  });

  return ok({ id: user.id, name: user.name, role: user.role });
});
