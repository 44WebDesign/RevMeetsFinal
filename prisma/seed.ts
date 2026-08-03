import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demoSeed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding RevMeet…");
  const summary = await seedDemoData(prisma, { reset: true });
  console.log("Seed complete:", summary);
  console.log("Demo logins (password: password123):");
  console.log("  Enthusiast: enthusiast@revmeet.test");
  console.log("  Organiser:  eastlondon@revmeet.test");
  console.log("  Venue:      harewood@revmeet.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
