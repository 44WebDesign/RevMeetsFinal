import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { exchangeCodeForProfile, googleConfigured, appOrigin } from "@/lib/google";
import { bootstrapProfileForRole } from "@/lib/profile";
import { ROLES, type Role } from "@/lib/enums";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);
const AVATAR_COLORS = ["#FF5F1F", "#E040FB", "#00BCD4", "#4CAF50", "#FFD700", "#2196F3"];

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const fail = (code: string) =>
    NextResponse.redirect(`${origin}/login?error=${code}`);

  if (!googleConfigured()) return fail("google_not_configured");

  const { searchParams } = new URL(req.url);
  if (searchParams.get("error")) return fail("google_denied");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return fail("google_failed");

  // Verify state signature + match the CSRF nonce cookie.
  const jar = await cookies();
  const cookieNonce = jar.get("g_oauth_nonce")?.value;
  jar.delete("g_oauth_nonce");

  let role: Role = "ENTHUSIAST";
  let next = "/dashboard";
  try {
    const { payload } = await jwtVerify(state, secret());
    if (!cookieNonce || payload.nonce !== cookieNonce) return fail("google_failed");
    if (ROLES.includes(payload.role as Role)) role = payload.role as Role;
    if (typeof payload.next === "string" && payload.next.startsWith("/")) next = payload.next;
  } catch {
    return fail("google_failed");
  }

  let profile;
  try {
    profile = await exchangeCodeForProfile(req, code);
  } catch (err) {
    console.error("[google] callback error:", err);
    return fail("google_failed");
  }

  // Find by googleId, else by email (links Google to an existing email account).
  let user =
    (await prisma.user.findUnique({ where: { googleId: profile.sub } })) ??
    (await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } }));

  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.sub,
          avatarUrl: user.avatarUrl ?? profile.picture ?? null,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        name: profile.name,
        googleId: profile.sub,
        avatarUrl: profile.picture ?? null,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        role,
      },
    });
    await bootstrapProfileForRole(user.id, role, user.name);
  }

  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
    name: user.name,
  });

  return NextResponse.redirect(`${origin}${next}`);
}
