import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { applyPromotionFromSession } from "@/lib/promotions";

// Stripe webhook. Belt-and-braces alongside the success redirect: even if the
// buyer closes the tab before returning, this applies the promotion.
// Configure in Stripe (Developers → Webhooks) pointing at /api/stripe/webhook,
// listening for `checkout.session.completed`, and set STRIPE_WEBHOOK_SECRET.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await applyPromotionFromSession(event.data.object as Stripe.Checkout.Session);
    } catch (err) {
      console.error("[stripe] webhook apply error:", err);
      // Return 200 anyway so Stripe doesn't retry indefinitely on a data issue;
      // the success redirect is a second chance to apply it.
    }
  }

  return NextResponse.json({ received: true });
}
