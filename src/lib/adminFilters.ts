import { ROLES, EVENT_TYPES, EVENT_STATUSES, type Role, type EventType, type EventStatus } from "./enums";

// Shared Prisma `where` builders for the admin search pages, so the listing
// page and its CSV export filter identically. Values come straight from URL
// search params and are validated against the known enum sets.

const ci = "insensitive" as const;

export type UserFilterParams = { q?: string; role?: string; status?: string };

export function adminUserWhere(p: UserFilterParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const and: unknown[] = [];
  if (p.q) {
    and.push({ OR: [{ name: { contains: p.q, mode: ci } }, { email: { contains: p.q, mode: ci } }] });
  }
  if (p.role && (ROLES as readonly string[]).includes(p.role)) where.role = p.role as Role;
  if (p.status === "suspended") where.suspended = true;
  else if (p.status === "active") where.suspended = false;
  if (and.length) where.AND = and;
  return where;
}

export type EventFilterParams = {
  q?: string;
  type?: string;
  status?: string;
  featured?: string;
  when?: string; // "upcoming" | "past" | "all"
};

export function adminEventWhere(p: EventFilterParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const and: unknown[] = [];
  if (p.q) {
    and.push({ OR: [{ title: { contains: p.q, mode: ci } }, { city: { contains: p.q, mode: ci } }] });
  }
  if (p.type && (EVENT_TYPES as readonly string[]).includes(p.type)) where.type = p.type as EventType;
  if (p.status && (EVENT_STATUSES as readonly string[]).includes(p.status)) where.status = p.status as EventStatus;
  if (p.featured === "yes") where.featured = true;
  if (p.when === "upcoming" || p.when === "past") {
    const now = new Date();
    where.startsAt = p.when === "upcoming" ? { gte: now } : { lt: now };
  }
  if (and.length) where.AND = and;
  return where;
}
