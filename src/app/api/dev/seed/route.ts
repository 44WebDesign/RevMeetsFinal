import { prisma } from "@/lib/prisma";
import { seedDemoData, backfillDemoAmenities } from "@/lib/demoSeed";
import { handle, ok, fail } from "@/lib/api";

// One-time demo-data loader.
//
// Safety:
//  - Disabled entirely unless SEED_TOKEN is set in the environment.
//  - Requires ?token=<SEED_TOKEN> to match.
//  - Default (full) seed refuses to run if ANY user already exists, so it can
//    never overwrite real accounts or data — it only populates an empty DB.
//  - mode=add performs an *additive* seed: it inserts only the demo rows that
//    don't already exist (matched by their fixed demo emails / slugs) and never
//    wipes or overwrites anything, so it's safe to run on a populated database
//    (e.g. to top up newly-introduced demo listings).
//
// Visit  <your-site>/api/dev/seed?token=YOUR_TOKEN           (empty DB) or
//        <your-site>/api/dev/seed?token=YOUR_TOKEN&mode=add  (top up demo data)
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

  // mode=add: additive seed — insert only the demo rows that are missing,
  // without wiping or overwriting. Safe on a live/populated database.
  if (url.searchParams.get("mode") === "add") {
    const summary = await seedDemoData(prisma, { additive: true });
    return ok({
      seeded: true,
      mode: "add",
      summary,
      message:
        "Additive seed complete — any missing demo clubs, venues and events were " +
        "added. Existing rows (demo or real) were left untouched. The summary counts " +
        "only newly-created venues/events (and users); clubs shows the demo total.",
    });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return ok({
      seeded: false,
      message:
        "Database already has data — refusing to run the full seed so nothing is " +
        "overwritten. To add any missing demo listings without touching existing " +
        "data, call the same URL with &mode=add.",
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
