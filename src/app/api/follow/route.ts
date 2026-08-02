import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  kind: z.enum(["club", "venue"]),
  id: z.string().min(1),
});

// Toggle following a club or venue; returns the new state + follower count.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const { kind, id } = schema.parse(await req.json());

  if (kind === "club") {
    const existing = await prisma.clubFollow.findUnique({
      where: { userId_clubId: { userId: user.id, clubId: id } },
    });
    if (existing) {
      await prisma.clubFollow.delete({ where: { id: existing.id } });
    } else {
      const club = await prisma.club.findUnique({ where: { id } });
      if (!club) return fail("Club not found", 404);
      await prisma.clubFollow.create({ data: { userId: user.id, clubId: id } });
    }
    const followers = await prisma.clubFollow.count({ where: { clubId: id } });
    return ok({ following: !existing, followers });
  }

  const existing = await prisma.venueFollow.findUnique({
    where: { userId_venueId: { userId: user.id, venueId: id } },
  });
  if (existing) {
    await prisma.venueFollow.delete({ where: { id: existing.id } });
  } else {
    const venue = await prisma.venue.findUnique({ where: { id } });
    if (!venue) return fail("Venue not found", 404);
    await prisma.venueFollow.create({ data: { userId: user.id, venueId: id } });
  }
  const followers = await prisma.venueFollow.count({ where: { venueId: id } });
  return ok({ following: !existing, followers });
});
