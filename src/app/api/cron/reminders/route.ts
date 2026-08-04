import { prisma } from "@/lib/prisma";
import { handle, ok, fail } from "@/lib/api";
import { sendEmail, emailShell, eventButton, emailConfigured } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { formatDateTime } from "@/lib/utils";

// Daily reminder job (see vercel.json crons). Emails everyone registered for
// an event starting within the next 36 hours, once per registration.
// Vercel calls it with  Authorization: Bearer <CRON_SECRET>  automatically
// when the CRON_SECRET env var is set.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = handle(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return fail("Unauthorized", 401);
  }
  if (!emailConfigured()) {
    return ok({ sent: 0, skipped: "email not configured (set RESEND_API_KEY)" });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const due = await prisma.registration.findMany({
    where: {
      reminderSent: false,
      event: { status: "PUBLISHED", startsAt: { gte: now, lte: windowEnd } },
    },
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true, slug: true, city: true, startsAt: true, address: true } },
    },
    take: 200,
  });

  let sent = 0;
  for (const r of due) {
    const url = absoluteUrl(`/events/${r.event.slug}`);
    const { sent: didSend } = await sendEmail({
      to: r.user.email,
      subject: `Reminder: ${r.event.title} is almost here`,
      html: emailShell(
        "Your event is coming up 🏁",
        `<p style="margin:0 0 8px"><strong>${r.event.title}</strong></p>
         <p style="margin:0;color:#aaa">📅 ${formatDateTime(r.event.startsAt)}<br/>📍 ${r.event.address ? `${r.event.address}, ` : ""}${r.event.city}</p>
         ${eventButton(url, "Event Details")}`,
      ),
    });
    if (didSend) {
      await prisma.registration.update({ where: { id: r.id }, data: { reminderSent: true } });
      sent++;
    }
  }

  return ok({ sent, considered: due.length });
});
