import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { venueSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { getVenues } from "@/lib/queries";

export const GET = handle(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const venues = await getVenues(searchParams.get("q") ?? undefined);
  return ok({ venues });
});

// Update the current venue account's own venue profile.
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  if (!user.venue) return fail("No venue profile on this account", 400);

  const data = venueSchema.parse(await req.json());
  const venue = await prisma.venue.update({
    where: { id: user.venue.id },
    data: {
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      postcode: data.postcode || null,
      lat: data.lat,
      lng: data.lng,
      imageUrl: data.imageUrl || null,
      website: data.website || null,
      capacity: data.capacity || null,
      amenities: data.amenities || "",
      categories: data.categories || "",
    },
  });
  return ok({ id: venue.id, slug: venue.slug });
});
