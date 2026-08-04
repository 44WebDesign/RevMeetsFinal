import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { sendEmail, emailShell, eventButton } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { formatDateTime } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

// Register (attend) an event.
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return fail("Event not found", 404);

  if (event.capacity && event._count.registrations >= event.capacity) {
    const already = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: id } },
    });
    if (!already) return fail("This event is full", 409);
  }

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId: user.id, eventId: id } },
  });
  await prisma.registration.upsert({
    where: { userId_eventId: { userId: user.id, eventId: id } },
    create: { userId: user.id, eventId: id },
    update: {},
  });

  // Confirmation email on first registration only.
  if (!existing) {
    const url = absoluteUrl(`/events/${event.slug}`);
    await sendEmail({
      to: user.email,
      subject: `You're going: ${event.title}`,
      html: emailShell(
        "You're registered! 🏁",
        `<p style="margin:0 0 8px">You're confirmed for <strong>${event.title}</strong>.</p>
         <p style="margin:0;color:#aaa">📅 ${formatDateTime(event.startsAt)}<br/>📍 ${event.city}</p>
         ${eventButton(url)}`,
      ),
    });
  }

  const count = await prisma.registration.count({ where: { eventId: id } });
  return ok({ registered: true, attendees: count });
});

// Cancel a registration.
export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  await prisma.registration.deleteMany({ where: { userId: user.id, eventId: id } });
  const count = await prisma.registration.count({ where: { eventId: id } });
  return ok({ registered: false, attendees: count });
});
