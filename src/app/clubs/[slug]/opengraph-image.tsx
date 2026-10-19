import { prisma } from "@/lib/prisma";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RevMeet car club";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await prisma.club
    .findUnique({ where: { slug }, select: { name: true, location: true } })
    .catch(() => null);

  if (!club) {
    return ogCard({ eyebrow: "Car Club", title: "Car club on RevMeet" });
  }

  return ogCard({
    eyebrow: "Car Club",
    title: club.name,
    meta: club.location,
    accent: "#FF5F1F",
  });
}
