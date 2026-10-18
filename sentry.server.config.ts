// Server-side Sentry init. Entirely DSN-gated: with no SENTRY_DSN set (the
// default), nothing initialises and the SDK stays dormant — so the app runs
// exactly as before until the owner opts in by adding the env var on Vercel.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Modest trace sampling keeps us well inside Sentry's free tier.
    tracesSampleRate: 0.1,
    // Only report from real deployments, never local dev noise.
    enabled: process.env.NODE_ENV === "production",
  });
}
