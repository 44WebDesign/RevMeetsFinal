import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { applyPromotionFromSession } from "@/lib/promotions";
import { appOrigin } from "@/lib/google";

// Stripe redirects here after a successful checkout. We verify the session was
// actually paid, then apply the featured promotion (shared, idempotent logic
// also used by the webhook).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const sessionId = new URL(req.url).searchParams.get("session_id");
  const fail = () => NextResponse.redirect(`${origin}/dashboard/promotions?promote=error`);

  if (!stripeConfigured() || !sessionId) return fail();

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const result = await applyPromotionFromSession(session);
    if (!result) return fail();
    return NextResponse.redirect(`${origin}${result.redirect}`);
  } catch (err) {
    console.error("[stripe] featured-success error:", err);
    return fail();
  }
}
