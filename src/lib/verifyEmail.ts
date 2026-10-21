import { createEmailVerifyToken } from "./auth";
import { sendEmail, emailShell, eventButton } from "./email";
import { absoluteUrl } from "./site";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Welcome + email-confirmation message, sent on signup and on resend. Returns
// whether an email was actually dispatched (false when Resend isn't configured).
export async function sendVerificationEmail(user: { id: string; email: string; name: string }): Promise<{ sent: boolean }> {
  const token = await createEmailVerifyToken(user);
  const link = absoluteUrl(`/api/auth/verify?token=${token}`);
  return sendEmail({
    to: user.email,
    subject: "Welcome to RevMeets — confirm your email",
    html: emailShell(
      "Welcome to RevMeets 🏁",
      `<p style="margin:0 0 12px">Hi ${escapeHtml(user.name)}, thanks for joining RevMeets — the UK's home for car events.</p>
       <p style="margin:0 0 12px">Please confirm your email address to finish setting up your account:</p>
       ${eventButton(link, "Confirm my email")}
       <p style="margin:16px 0 0;color:#777;font-size:12px">This link expires in 7 days. If you didn't create a RevMeets account, you can safely ignore this email.</p>`,
    ),
  });
}
