import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";

// Update the signed-in user's own profile.
export const PATCH = handle(async (req: Request) => {
  const user = await requireUser();
  const data = profileSchema.parse(await req.json());

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      bio: data.bio ?? null,
      ...(data.avatarColor ? { avatarColor: data.avatarColor } : {}),
    },
  });

  return ok({ ok: true });
});
