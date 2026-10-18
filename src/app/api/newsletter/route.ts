import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok } from "@/lib/api";
import { rateLimited } from "@/lib/rateLimit";

// "Events near you" email capture from the homepage. Stores the signup
// regardless of whether Resend is configured — sending is a separate concern
// (the weekly digest cron), so this degrades gracefully with no email provider.
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  area: z.string().trim().max(120).optional(),
  company: z.string().max(0).optional().or(z.literal("")), // honeypot
});

export const POST = handle(async (req: Request) => {
  const limited = rateLimited(req, "newsletter", 10, 60 * 60 * 1000); // 10/hour/IP
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const { email, area, company } = schema.parse(body);
  if (company) return ok({ subscribed: true }); // honeypot tripped — drop silently
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
