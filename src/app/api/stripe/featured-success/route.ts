import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { appOrigin } from "@/lib/google";

// Stripe redirects here after a successful checkout. We verify the session was
// actually paid, then apply the featured promotion. Idempotent — safe if the
// user reloads.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  const back = (slug: string, ok: boolean) =>
    NextResponse.redirect(`${origin}/events/${slug}?promoted=${ok ? "1" : "0"}`);
  const fail = () => NextResponse.redirect(`${origin}/dashboard?promote=error`);

  if (!stripeConfigured() || !sessionId) return fail();

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return fail();

    const eventId = session.metadata?.eventId;
    const days = Number(session.metadata?.days ?? "30");
    if (!eventId) return fail();

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return fail();

    // Extend from the later of now / current expiry.
    const base =
      event.featuredUntil && event.featuredUntil > new Date() ? event.featuredUntil : new Date();
    const featuredUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.event.update({
      where: { id: eventId },
      data: { featured: true, featuredUntil },
    });

    return back(event.slug, true);
  } catch (err) {
    console.error("[stripe] featured-success error:", err);
    return fail();
  }
}
