import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function loadOwned(id: string, userId: string, isAdmin: boolean) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { error: fail("Event not found", 404) as Response };
  if (event.organiserId !== userId && !isAdmin) {
    return { error: fail("You do not own this event", 403) as Response };
  }
  return { event };
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { event, error } = await loadOwned(id, user.id, user.role === "ADMIN");
  if (error) return error;

  const data = eventSchema.partial().parse(await req.json());

  const updated = await prisma.event.update({
    where: { id: event!.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startsAt !== undefined ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.region !== undefined ? { region: data.region || null } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.lat !== undefined ? { lat: data.lat } : {}),
      ...(data.lng !== undefined ? { lng: data.lng } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity || null } : {}),
      ...(data.priceInfo !== undefined ? { priceInfo: data.priceInfo || null } : {}),
      ...(data.amenities !== undefined ? { amenities: data.amenities || "" } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.venueId !== undefined ? { venueId: data.venueId || null } : {}),
    },
  });

  return ok({ id: updated.id, slug: updated.slug });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { event, error } = await loadOwned(id, user.id, user.role === "ADMIN");
  if (error) return error;

  await prisma.event.delete({ where: { id: event!.id } });
  return ok({ ok: true });
});
