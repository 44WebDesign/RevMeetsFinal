import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { sendEmail, emailShell, emailConfigured } from "@/lib/email";
import { notifyMany } from "@/lib/notifications";
import { logAdmin } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SEGMENTS = ["ALL", "ENTHUSIAST", "ORGANISER", "VENUE", "ADMIN", "NEWSLETTER"] as const;
const MAX = 5000;

const schema = z.object({
  segment: z.enum(SEGMENTS),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(3).max(4000),
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Broadcast an announcement to a segment: in-app notification (account holders)
// + email (when Resend is configured). Newsletter subscribers get email only.
export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const { segment, subject, message } = schema.parse(await req.json());

  const bodyHtml = `<p style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(message)}</p>`;
  let recipientEmails: string[] = [];
  let userIds: string[] = [];

  if (segment === "NEWSLETTER") {
    const subs = await prisma.newsletterSignup.findMany({ take: MAX, select: { email: true } });
    recipientEmails = subs.map((s) => s.email);
  } else {
    const where = segment === "ALL" ? { suspended: false } : { suspended: false, role: segment };
    const users = await prisma.user.findMany({ where, take: MAX, select: { id: true, email: true } });
    userIds = users.map((u) => u.id);
    recipientEmails = users.map((u) => u.email);
  }

  // In-app notification for account holders.
  if (userIds.length > 0) {
    await notifyMany(userIds, { type: "ANNOUNCEMENT", message: subject, link: null });
  }

  // Email (best-effort, only when configured).
  let emailed = 0;
  if (emailConfigured()) {
    for (const to of recipientEmails) {
      const { sent } = await sendEmail({ to, subject, html: emailShell(subject, bodyHtml) });
      if (sent) emailed++;
    }
  }

  await logAdmin(admin, {
    action: "ANNOUNCE",
    targetType: "BROADCAST",
    detail: `${segment} · ${recipientEmails.length} recipients · "${subject}"`,
  });

  return ok({
    ok: true,
    segment,
    recipients: recipientEmails.length,
    inApp: userIds.length,
    emailed,
    emailConfigured: emailConfigured(),
  });
});
