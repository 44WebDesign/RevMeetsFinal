import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { clubSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { getClubs } from "@/lib/queries";

export const GET = handle(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const clubs = await getClubs(searchParams.get("q") ?? undefined);
  return ok({ clubs });
});

// Update the current organiser's own club profile.
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  if (!user.club) return fail("No club profile on this account", 400);

  const data = clubSchema.parse(await req.json());
  const club = await prisma.club.update({
    where: { id: user.club.id },
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      region: data.region || null,
      imageUrl: data.imageUrl || null,
      website: data.website || null,
      categories: data.categories || "",
    },
  });
  return ok({ id: club.id, slug: club.slug });
});
