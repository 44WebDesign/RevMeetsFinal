import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/auth";
import { forgotSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import { sendEmail, emailShell, eventButton } from "@/lib/email";
import { appOrigin } from "@/lib/google";

export const POST = handle(async (req: Request) => {
  const { email } = forgotSchema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always respond the same way, so the endpoint never reveals whether an
  // email is registered.
  if (user) {
    const token = await createPasswordResetToken(user);
    const link = `${appOrigin(req)}/reset-password?token=${token}`;
    const { sent } = await sendEmail({
      to: user.email,
      subject: "Reset your RevMeet password",
      html: emailShell(
        "Reset your password",
        `<p style="margin:0 0 8px">We received a request to reset your RevMeet password. This link is valid for one hour.</p>
         ${eventButton(link, "Reset Password")}
         <p style="margin:16px 0 0;color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>`,
      ),
    });
    // If email isn't configured, log the link so it's still recoverable in dev.
    if (!sent) console.log(`[forgot] reset link for ${user.email}: ${link}`);
  }

  return ok({ ok: true });
});
