import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/api";
import { sendEmail, emailShell, emailConfigured } from "@/lib/email";
import { rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  message: z.string().trim().min(5, "Please add a short message").max(4000),
  // Honeypot — real users never fill this hidden field; bots do.
  company: z.string().max(0).optional().or(z.literal("")),
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const POST = handle(async (req: Request) => {
  const limited = rateLimited(req, "contact", 5, 60 * 60 * 1000); // 5/hour/IP
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const data = schema.parse(body);

  // Honeypot tripped → pretend success, drop silently.
  if (data.company) return ok({ ok: true });

  await prisma.contactMessage.create({
    data: { name: data.name, email: data.email, message: data.message },
  });

  // Notify: a dedicated SUPPORT_EMAIL if set, otherwise every admin.
  if (emailConfigured()) {
    const support = process.env.SUPPORT_EMAIL;
    const recipients = support
      ? [support]
      : (await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })).map((a) => a.email);
    const html = `
      <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(data.message)}</p>`;
    for (const to of recipients) {
      await sendEmail({ to, subject: `Contact form: ${data.name}`, html: emailShell("New contact message 📩", html) });
    }
  }

  return ok({ ok: true, message: "Thanks — your message has been sent. We'll get back to you soon." });
});
