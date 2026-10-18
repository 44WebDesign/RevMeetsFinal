import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handle, ok, fail } from "@/lib/api";
import { bootstrapProfileForRole } from "@/lib/profile";
import { notifyAdmins } from "@/lib/notifications";
import { rateLimited } from "@/lib/rateLimit";
import { ROLE_LABELS, type Role } from "@/lib/enums";

const AVATAR_COLORS = ["#FF5F1F", "#E040FB", "#00BCD4", "#4CAF50", "#FFD700", "#2196F3"];

export const POST = handle(async (req: Request) => {
  const limited = rateLimited(req, "register", 5, 60 * 60 * 1000); // 5/hour/IP
  if (limited) return limited;

  const body = await req.json();
  // Honeypot — bots fill this hidden field; humans never do. Drop silently.
  if (typeof body?.company === "string" && body.company.length > 0) {
    return fail("Something went wrong. Please try again.", 400);
  }
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
  await bootstrapProfileForRole(user.id, data.role, data.name);

  // Alert admins of the new signup (in-app always, email when configured).
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;
  await notifyAdmins(
    { type: "NEW_USER", message: `New ${roleLabel} signed up: ${user.name} (${user.email})`, link: "/admin/users" },
    { subject: `New RevMeet signup: ${user.name}`, html: `<p style="margin:0">A new <strong>${roleLabel}</strong> just joined.</p><p style="margin:8px 0 0;color:#aaa">${user.name} · ${user.email}</p>` },
  );

  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role as "ENTHUSIAST" | "ORGANISER" | "VENUE" | "ADMIN",
    name: user.name,
  });

  return ok({ id: user.id, name: user.name, role: user.role }, 201);
});
