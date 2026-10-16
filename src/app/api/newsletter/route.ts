import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/api";

// "Events near you" email capture from the homepage. Stores the signup
// regardless of whether Resend is configured — sending is a separate concern
// (the weekly digest cron), so this degrades gracefully with no email provider.
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  area: z.string().trim().max(120).optional(),
});

export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const { email, area } = schema.parse(body);
  const normalised = email.trim().toLowerCase();

  // Idempotent: re-subscribing just refreshes the area, never errors.
  await prisma.newsletterSignup.upsert({
    where: { email: normalised },
    update: area ? { area } : {},
    create: { email: normalised, area: area || null },
  });

  return ok({
    subscribed: true,
    message: "You're on the list — we'll email you about events near you.",
  });
});
