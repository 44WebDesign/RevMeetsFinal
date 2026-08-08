import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { PromoteCard } from "@/components/PromoteCard";
import { stripeConfigured, featuredPriceLabel, featuredDays } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata = { title: "Manage Event", robots: { index: false } };

function toLocalInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promote?: string }>;
}) {
  const { id } = await params;
  const { promote } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dashboard/events/${id}/edit`);

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  if (event.organiserId !== user.id && user.role !== "ADMIN") redirect("/dashboard");

  const initial: EventFormValues = {
    title: event.title,
    type: event.type,
    description: event.description,
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    city: event.city,
    region: event.region ?? "",
    address: event.address ?? "",
    priceInfo: event.priceInfo ?? "",
    capacity: event.capacity ? String(event.capacity) : "",
    imageUrl: event.imageUrl ?? "",
    lat: event.lat,
    lng: event.lng,
    status: event.status,
    venueId: event.venueId ?? "",
    amenities: event.amenities ?? "",
  };

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="sec-label">Manage</div>
        <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>EDIT EVENT</div>
        <p className="sec-sub" style={{ marginBottom: "2rem" }}>
          Update the details, change its status, or remove it entirely.
        </p>
        <PromoteCard
          eventId={event.id}
          stripeEnabled={stripeConfigured()}
          priceLabel={featuredPriceLabel()}
          days={featuredDays()}
          featuredUntil={event.featuredUntil ? event.featuredUntil.toISOString() : null}
          notice={promote === "cancelled" ? "cancelled" : null}
        />
        <EventForm mode="edit" eventId={event.id} initial={initial} />
      </div>
    </section>
  );
}
