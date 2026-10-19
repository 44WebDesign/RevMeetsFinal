import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { eventTypeColor, EVENT_TYPE_LABELS, type EventType } from "@/lib/enums";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RevMeet event";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event
    .findUnique({ where: { slug }, select: { title: true, type: true, city: true, startsAt: true } })
    .catch(() => null);

  if (!event) {
    return ogCard({ eyebrow: "Car Event", title: "Event on RevMeet" });
  }

  const label = EVENT_TYPE_LABELS[event.type as EventType] ?? "Car Event";
  return ogCard({
    eyebrow: label,
    title: event.title,
    meta: `${formatDate(event.startsAt)}  ·  ${event.city}`,
    accent: eventTypeColor(event.type),
  });
}
