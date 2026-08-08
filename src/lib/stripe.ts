import Stripe from "stripe";

// Stripe is optional: paid promotion is only offered when STRIPE_SECRET_KEY is
// set. The client is created lazily so the app runs fine without it.

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

// Promotion pricing (configurable via env).
export function featuredPricePence(): number {
  const v = Number(process.env.FEATURED_PRICE_GBP);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 999; // £9.99 default
}

export function featuredDays(): number {
  const v = Number(process.env.FEATURED_DAYS);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 30;
}

export function featuredPriceLabel(): string {
  return `£${(featuredPricePence() / 100).toFixed(2)}`;
}
