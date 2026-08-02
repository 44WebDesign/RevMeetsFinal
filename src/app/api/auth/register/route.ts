import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { uniqueSlug } from "@/lib/utils";

const AVATAR_COLORS = ["#FF5F1F", "#E040FB", "#00BCD4", "#4CAF50", "#FFD700", "#2196F3"];

export const POST = handle(async (req: Request) => {
  const body = await req.json();
  const data = registerSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return fail("An account with that email already exists", 409);

  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      avatarColor,
    },
  });

  // Bootstrap an empty club or venue profile so hosts/venues can fill it in.
  if (data.role === "ORGANISER") {
    await prisma.club.create({
      data: {
        ownerId: user.id,
        name: `${data.name}'s Club`,
        slug: uniqueSlug(`${data.name}-club`),
        description: "Tell the community about your club and the events you run.",
        location: "United Kingdom",
      },
    });
  } else if (data.role === "VENUE") {
    await prisma.venue.create({
      data: {
        ownerId: user.id,
        name: `${data.name}`,
        slug: uniqueSlug(data.name),
        description: "Describe your venue and why it's great for car meets and events.",
        address: "",
        city: "United Kingdom",
        lat: 52.5,
        lng: -1.9,
      },
    });
  }

  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role as "ENTHUSIAST" | "ORGANISER" | "VENUE" | "ADMIN",
    name: user.name,
  });

  return ok({ id: user.id, name: user.name, role: user.role }, 201);
});
