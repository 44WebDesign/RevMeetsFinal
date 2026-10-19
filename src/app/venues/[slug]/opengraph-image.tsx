import { prisma } from "@/lib/prisma";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RevMeet venue";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = await prisma.venue
    .findUnique({ where: { slug }, select: { name: true, city: true } })
    .catch(() => null);

  if (!venue) {
    return ogCard({ eyebrow: "Venue", title: "Venue on RevMeet" });
  }

  return ogCard({
    eyebrow: "Venue",
    title: venue.name,
    meta: venue.city,
    accent: "#00BCD4",
  });
}
