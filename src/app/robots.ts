import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Dynamic so the sitemap/host URL reflects the runtime domain (Vercel/custom).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / non-content routes out of the index.
        disallow: ["/api/", "/dashboard", "/login", "/register"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
