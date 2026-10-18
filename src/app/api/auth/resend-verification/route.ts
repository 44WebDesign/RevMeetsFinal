import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { emailConfigured } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/verifyEmail";
import { rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  const limited = rateLimited(req, "resend-verify", 3, 15 * 60 * 1000); // 3 / 15 min / IP
  if (limited) return limited;

  const user = await requireUser();
  if (user.emailVerified) return ok({ ok: true, alreadyVerified: true });
  if (!emailConfigured()) return fail("Email isn't set up yet — please try again later.", 400);

  await sendVerificationEmail({ id: user.id, email: user.email, name: user.name });
  return ok({ ok: true, message: "Confirmation email sent — check your inbox." });
});
