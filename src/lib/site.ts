// Canonical site URL resolution for metadata, sitemap and structured data.
//
// Priority:
//  1. NEXT_PUBLIC_SITE_URL  — set this to your custom domain in production.
//  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain.
//  3. localhost fallback for local dev.

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "RevMeet";
export const SITE_DESCRIPTION =
  "Discover car shows, track days, night cruises and meetups near you. The UK's platform for finding and organising car events — search by map or list.";
