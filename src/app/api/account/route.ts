import { prisma } from "@/lib/prisma";
import { requireUser, destroySession, createSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import type { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

// Update the signed-in member's own profile (display name, bio, avatar colour,
// garage, home location + weekly-digest opt-in).
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  const data = profileSchema.parse(await req.json());

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.avatarColor !== undefined ? { avatarColor: data.avatarColor } : {}),
      ...(data.carMake !== undefined ? { carMake: data.carMake } : {}),
      ...(data.carModel !== undefined ? { carModel: data.carModel } : {}),
      ...(data.carYear !== undefined ? { carYear: data.carYear } : {}),
      ...(data.homeCity !== undefined ? { homeCity: data.homeCity } : {}),
      ...(data.homeLat !== undefined ? { homeLat: data.homeLat } : {}),
      ...(data.homeLng !== undefined ? { homeLng: data.homeLng } : {}),
      ...(data.digestOptIn !== undefined ? { digestOptIn: data.digestOptIn } : {}),
    },
  });

  // Keep the session token's name in sync so the change shows in the nav
  // immediately (the name is carried in the JWT, not read per-request).
  await createSession({
    sub: updated.id,
    email: updated.email,
    role: updated.role as Role,
    name: updated.name,
  });

  return ok({ ok: true });
});

// Self-service account deletion (GDPR right to erasure). Removes the account and
// cascades to the user's own content, then clears the session.
export const DELETE = handle(async () => {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return ok({ ok: true });
});
