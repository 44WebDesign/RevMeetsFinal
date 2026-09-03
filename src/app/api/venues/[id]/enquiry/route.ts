import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { sendEmail, emailShell } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ message: z.string().min(5, "Add a short message").max(1000) });

// Send an enquiry to a venue owner (lead-gen for the venue). Requires login to
// cut spam; delivers as an in-app notification + email so the owner can reply.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { message } = schema.parse(await req.json());

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { owner: { select: { id: true, email: true } } },
  });
  if (!venue) return fail("Venue not found", 404);
  if (venue.ownerId === user.id) return fail("This is your own venue", 400);

  await notify({
    userId: venue.owner.id,
    type: "ENQUIRY",
    message: `New enquiry from ${user.name} about ${venue.name}`,
    link: `/venues/${venue.slug}`,
  });

  await sendEmail({
    to: venue.owner.email,
    subject: `New enquiry about ${venue.name}`,
    html: emailShell(
      "You've got a new enquiry 📩",
      `<p style="margin:0 0 8px"><strong>${escapeHtml(user.name)}</strong> is interested in <strong>${escapeHtml(venue.name)}</strong>.</p>
       <p style="margin:0 0 12px;color:#ddd;white-space:pre-wrap">“${escapeHtml(message)}”</p>
       <p style="margin:0;color:#aaa;font-size:13px">Reply directly to them: <a href="mailto:${user.email}" style="color:#FF5F1F">${escapeHtml(user.email)}</a><br/>
       View your venue: <a href="${absoluteUrl(`/venues/${venue.slug}`)}" style="color:#FF5F1F">${venue.name}</a></p>`,
    ),
  });

  return ok({ ok: true }, 201);
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
