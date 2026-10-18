/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Event/club/venue images are user-supplied URLs (or Vercel Blob uploads),
    // so allow any https host; next/image still resizes and serves WebP/AVIF.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

// Sentry is fully opt-in. The build plugin (source maps, client init, the
// instrumentation wiring) is only applied when a DSN is configured — so with
// no SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN the config stays plain and the build
// is identical to a Sentry-free project (and can never flake on it).
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

let config = nextConfig;
if (sentryDsn) {
  const { withSentryConfig } = require("@sentry/nextjs");
  config = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Source-map upload needs an auth token; skip it (with no error) when the
    // owner hasn't set one, so error reporting still works without it.
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    disableLogger: true,
  });
}

module.exports = config;
