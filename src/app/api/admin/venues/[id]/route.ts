import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminListingSchema } from "@/lib/validation";
import { handle, ok } from "@/lib/api";
import { logAdmin } from "@/lib/adminAudit";

type Ctx = { params: Promise<{ id: string }> };

// Moderate a venue listing: grant/revoke the Verified badge or override featured.
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const data = adminListingSchema.parse(await req.json());

  await prisma.venue.update({
    where: { id },
    data: {
      ...(data.verified !== undefined ? { verified: data.verified } : {}),
      ...(data.featured !== undefined
        ? { featured: data.featured, ...(data.featured ? {} : { featuredUntil: null }) }
        : {}),
    },
  });
  const parts: string[] = [];
  if (data.verified !== undefined) parts.push(data.verified ? "verified" : "unverified");
  if (data.featured !== undefined) parts.push(data.featured ? "featured" : "unfeatured");
  await logAdmin(admin, { action: "VENUE_UPDATE", targetType: "VENUE", targetId: id, detail: parts.join(", ") });
  return ok({ ok: true });
});
