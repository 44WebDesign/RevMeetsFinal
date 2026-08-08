import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "./enums";

const COOKIE_NAME = "revmeet_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as Role,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// Full user record for the current session, or null.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    include: { club: true, venue: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated", 401);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

// ---- Password reset tokens (stateless) ----
// A signed, 1-hour token whose fingerprint is derived from the current
// password hash, so it becomes invalid the moment the password changes
// (single practical use) — no DB table required.
function pwFingerprint(passwordHash: string | null): string {
  return createHash("sha256").update(passwordHash ?? "no-password").digest("hex").slice(0, 16);
}

export async function createPasswordResetToken(user: {
  id: string;
  passwordHash: string | null;
}): Promise<string> {
  return new SignJWT({ purpose: "pwreset", fp: pwFingerprint(user.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "pwreset" || !payload.sub) return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub as string } });
    if (!user) return null;
    if (payload.fp !== pwFingerprint(user.passwordHash)) return null; // already used / stale
    return { userId: user.id };
  } catch {
    return null;
  }
}
