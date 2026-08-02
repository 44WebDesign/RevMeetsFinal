import { getCurrentUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null });
  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasClub: !!user.club,
      hasVenue: !!user.venue,
    },
  });
});
