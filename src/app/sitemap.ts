import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

// Generated per request so the build never needs a database connection, and so
// new events/clubs/venues appear in the sitemap as soon as they're published.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/map`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/clubs`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/venues`, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const [events, clubs, venues] = await Promise.all([
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { startsAt: "asc" },
        take: 5000,
      }),
      prisma.club.findMany({ select: { slug: true, updatedAt: true }, take: 5000 }),
      prisma.venue.findMany({ select: { slug: true, updatedAt: true }, take: 5000 }),
    ]);

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));
    const clubRoutes: MetadataRoute.Sitemap = clubs.map((c) => ({
      url: `${base}/clubs/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    const venueRoutes: MetadataRoute.Sitemap = venues.map((v) => ({
      url: `${base}/venues/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...eventRoutes, ...clubRoutes, ...venueRoutes];
  } catch {
    // If the DB is unreachable, still return the static routes.
    return staticRoutes;
  }
}
