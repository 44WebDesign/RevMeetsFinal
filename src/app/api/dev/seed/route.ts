import { prisma } from "@/lib/prisma";
import { seedDemoData, backfillDemoAmenities } from "@/lib/demoSeed";
import { handle, ok, fail } from "@/lib/api";

// One-time demo-data loader.
//
// Safety:
//  - Disabled entirely unless SEED_TOKEN is set in the environment.
//  - Requires ?token=<SEED_TOKEN> to match.
//  - Refuses to run if ANY user already exists, so it can never overwrite real
//    accounts or data — it only populates a brand-new, empty database.
//
// Visit  <your-site>/api/dev/seed?token=YOUR_TOKEN  once after deploying.
export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const token = process.env.SEED_TOKEN;
  if (!token) {
    return fail("Seeding is disabled. Set the SEED_TOKEN environment variable to enable it.", 403);
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("token");
  if (provided !== token) {
    return fail("Invalid or missing token.", 401);
  }

  // mode=amenities: backfill amenity data onto demo rows seeded before the
  // amenity catalog existed. Safe on a live database — only touches demo
  // accounts' venues/events plus empty venue-linked events.
  if (url.searchParams.get("mode") === "amenities") {
    const result = await backfillDemoAmenities(prisma);
    return ok({
      mode: "amenities",
      ...result,
      message: "Demo amenities backfilled. Existing user selections were not touched.",
    });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return ok({
      seeded: false,
      message:
        "Database already has data — refusing to seed so nothing is overwritten. " +
        "Seeding only runs on a completely empty database.",
    });
  }

  const summary = await seedDemoData(prisma, { reset: true });
  return ok({
    seeded: true,
    summary,
    message:
      "Demo data loaded. You can now remove the SEED_TOKEN environment variable. " +
      "Demo logins use the password 'password123'.",
    demoLogins: {
      admin: "admin@revmeet.test",
      enthusiast: "enthusiast@revmeet.test",
      host: "eastlondon@revmeet.test",
      venue: "harewood@revmeet.test",
    },
  });
});
