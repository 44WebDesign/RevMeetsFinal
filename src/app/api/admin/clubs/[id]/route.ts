import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminListingSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Moderate a club listing: grant/revoke the Verified badge or override featured.
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const data = adminListingSchema.parse(await req.json());

  await prisma.club.update({
    where: { id },
    data: {
      ...(data.verified !== undefined ? { verified: data.verified } : {}),
      ...(data.featured !== undefined
        ? { featured: data.featured, ...(data.featured ? {} : { featuredUntil: null }) }
        : {}),
    },
  });
  return ok({ ok: true });
});
