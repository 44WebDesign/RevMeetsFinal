import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { googleConfigured, buildAuthUrl, appOrigin } from "@/lib/google";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Kick off the Google sign-in flow. Optional ?role= and ?next= carry the chosen
// account type and post-login destination through to the callback.
export async function GET(req: Request) {
  const origin = appOrigin(req);
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "ENTHUSIAST";
  const next = searchParams.get("next") ?? "/dashboard";
  const nonce = crypto.randomUUID();

  // Signed, short-lived state prevents tampering; the cookie nonce blocks CSRF.
  const state = await new SignJWT({ nonce, role, next })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());

  (await cookies()).set("g_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildAuthUrl(req, state));
}
