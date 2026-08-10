import { prisma } from "@/lib/prisma";
import { getCurrentUser, createSession } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import type { Role } from "@/lib/enums";

// One-time admin bootstrap. Visit while logged in:
//   /api/admin/claim?token=YOUR_ADMIN_CLAIM_TOKEN
// Promotes the signed-in account to ADMIN. Guarded three ways: disabled unless
// ADMIN_CLAIM_TOKEN is set, requires the token to match, and requires an active
// login. Remove the env var again once you've claimed admin.
export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const token = process.env.ADMIN_CLAIM_TOKEN;
  if (!token) {
    return fail("Admin claim is disabled. Set the ADMIN_CLAIM_TOKEN environment variable to enable it.", 403);
  }

  const provided = new URL(req.url).searchParams.get("token");
  if (provided !== token) {
    return fail("Invalid or missing token.", 401);
  }

  const user = await getCurrentUser();
  if (!user) {
    return fail("Log in first, then open this link again (with the token) in the same browser.", 401);
  }

  if (user.role === "ADMIN") {
    return ok({ ok: true, message: "You're already an admin. Head to /admin." });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  // Refresh the session cookie so the Admin nav link appears immediately.
  await createSession({
    sub: updated.id,
    email: updated.email,
    role: updated.role as Role,
    name: updated.name,
  });

  return ok({
    ok: true,
    message: `${updated.email} is now an admin. Open /admin — and you can now remove the ADMIN_CLAIM_TOKEN environment variable.`,
  });
});
