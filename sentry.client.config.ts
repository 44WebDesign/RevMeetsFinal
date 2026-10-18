// Browser-side Sentry init. Uses the public DSN (NEXT_PUBLIC_SENTRY_DSN) so it
// can run in the client bundle. Loaded by the Sentry build plugin, which is
// itself only wired up (in next.config.js) when a DSN is present — so with no
// DSN this file is never bundled and the client ships Sentry-free.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Session Replay is off by default to respect privacy and stay in free tier.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enabled: process.env.NODE_ENV === "production",
  });
}
