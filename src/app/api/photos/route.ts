import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handle, ok, fail } from "@/lib/api";
import { notify } from "@/lib/notifications";

const photoSchema = z.object({
  url: z.string().url("A valid image URL is required"),
  caption: z.string().max(200).optional().nullable(),
  // Omit for a build-gallery photo; set to attach a photo to an event.
  eventId: z.string().optional().nullable(),
});

// Add a photo to the caller's build gallery, or to an event they attended.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const data = photoSchema.parse(await req.json());

  if (data.eventId) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) return fail("Event not found", 404);
    const registered = await prisma.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
    });
    if (!registered) {
      return fail("Only attendees can add photos to an event — register first", 403);
    }
    const photo = await prisma.photo.create({
      data: { uploaderId: user.id, eventId: event.id, url: data.url, caption: data.caption || null },
    });
    if (event.organiserId !== user.id) {
      await notify({
        userId: event.organiserId,
        type: "PHOTO",
        message: `${user.name} added a photo to ${event.title}`,
        link: `/events/${event.slug}`,
      });
    }
    return ok({ id: photo.id }, 201);
  }

  const photo = await prisma.photo.create({
    data: { uploaderId: user.id, url: data.url, caption: data.caption || null },
  });
  return ok({ id: photo.id }, 201);
});
