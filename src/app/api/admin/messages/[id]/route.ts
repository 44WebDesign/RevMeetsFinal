import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { sendEmail, emailShell, emailConfigured } from "@/lib/email";
import { logAdmin } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const replySchema = z.object({ reply: z.string().trim().min(2).max(4000) });
const patchSchema = z.object({ handled: z.boolean() });

// Reply by email to a contact message (and mark it handled).
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { reply } = replySchema.parse(await req.json());

  if (!emailConfigured()) {
    return fail("Email isn't configured — set RESEND_API_KEY to reply by email (you can still mark the message handled).", 400);
  }

  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg) return fail("Message not found", 404);

  const html = `
    <p style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(reply)}</p>
    <hr style="border:none;border-top:1px solid #262626;margin:16px 0" />
    <p style="margin:0;color:#777;font-size:12px">In reply to your message:</p>
    <p style="margin:4px 0 0;color:#777;font-size:12px;white-space:pre-wrap">${escapeHtml(msg.message)}</p>`;
  const { sent } = await sendEmail({ to: msg.email, subject: "Re: your message to RevMeets", html: emailShell("RevMeets", html) });
  if (!sent) return fail("Couldn't send the email — check your Resend configuration.", 502);

  await prisma.contactMessage.update({ where: { id }, data: { repliedAt: new Date() } });
  await logAdmin(admin, { action: "MESSAGE_REPLY", targetType: "CONTACT", targetId: id, detail: `replied to ${msg.email}` });
  return ok({ ok: true });
});

// Toggle handled state without emailing.
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { handled } = patchSchema.parse(await req.json());
  await prisma.contactMessage.update({ where: { id }, data: { repliedAt: handled ? new Date() : null } });
  await logAdmin(admin, { action: "MESSAGE_UPDATE", targetType: "CONTACT", targetId: id, detail: handled ? "marked handled" : "marked new" });
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await prisma.contactMessage.deleteMany({ where: { id } });
  await logAdmin(admin, { action: "MESSAGE_DELETE", targetType: "CONTACT", targetId: id });
  return ok({ ok: true });
});
