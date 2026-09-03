import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VenueForm } from "@/components/VenueForm";
import { PromoteCard } from "@/components/PromoteCard";
import { stripeConfigured, featuredPriceLabel, featuredDays } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Venue", robots: { index: false } };

export default async function VenueProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ promote?: string }>;
}) {
  const { promote } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/venue");
  if (!user.venue) redirect("/dashboard");

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sec-label">Your Venue</div>
        <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>VENUE PROFILE</div>
        <p className="sec-sub" style={{ marginBottom: "2rem" }}>
          Complete your profile so organisers can find you and pin you on the map.
        </p>
        <PromoteCard
          promoteUrl={`/api/venues/${user.venue.id}/promote`}
          kind="venue"
          stripeEnabled={stripeConfigured()}
          priceLabel={featuredPriceLabel()}
          days={featuredDays()}
          featuredUntil={user.venue.featuredUntil ? user.venue.featuredUntil.toISOString() : null}
          notice={promote === "cancelled" ? "cancelled" : null}
        />
        <VenueForm
          initial={{
            name: user.venue.name,
            description: user.venue.description,
            address: user.venue.address,
            city: user.venue.city,
            postcode: user.venue.postcode ?? "",
            imageUrl: user.venue.imageUrl ?? "",
            website: user.venue.website ?? "",
            capacity: user.venue.capacity ? String(user.venue.capacity) : "",
            amenities: user.venue.amenities ?? "",
            categories: user.venue.categories ?? "",
            lat: user.venue.lat,
            lng: user.venue.lng,
          }}
        />
      </div>
    </section>
  );
}
