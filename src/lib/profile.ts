import { prisma } from "./prisma";
import { uniqueSlug } from "./utils";
import type { Role } from "./enums";

// Create the empty Club or Venue profile that hosts/venues start with, so they
// have something to edit immediately after signing up (email or Google).
export async function bootstrapProfileForRole(
  userId: string,
  role: Role,
  name: string,
): Promise<void> {
  if (role === "ORGANISER") {
    const exists = await prisma.club.findUnique({ where: { ownerId: userId } });
    if (exists) return;
    await prisma.club.create({
      data: {
        ownerId: userId,
        name: `${name}'s Club`,
        slug: uniqueSlug(`${name}-club`),
        description: "Tell the community about your club and the events you run.",
        location: "United Kingdom",
      },
    });
  } else if (role === "VENUE") {
    const exists = await prisma.venue.findUnique({ where: { ownerId: userId } });
    if (exists) return;
    await prisma.venue.create({
      data: {
        ownerId: userId,
        name,
        slug: uniqueSlug(name),
        description: "Describe your venue and why it's great for car meets and events.",
        address: "",
        city: "United Kingdom",
        lat: 52.5,
        lng: -1.9,
      },
    });
  }
}
