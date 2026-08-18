import { z } from "zod";
import { EVENT_TYPES } from "./enums";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(80),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    // Public sign-up is limited to enthusiast, organiser (club) or venue.
    role: z.enum(["ENTHUSIAST", "ORGANISER", "VENUE"]),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  bio: z.string().max(500).optional().nullable(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour")
    .optional(),
  // "Garage" — the member's car/build shown on their public profile.
  carMake: z.string().max(60).optional().nullable(),
  carModel: z.string().max(60).optional().nullable(),
  carYear: z.coerce.number().int().min(1885).max(2100).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  type: z.enum(EVENT_TYPES),
  startsAt: z.string().min(1, "Start date/time is required"),
  endsAt: z.string().optional().nullable(),
  city: z.string().min(2).max(80),
  region: z.string().max(80).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  priceInfo: z.string().max(80).optional().nullable(),
  venueId: z.string().optional().nullable(),
  amenities: z.string().max(600).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
  // Recurrence (create only): generate repeated occurrences.
  recurrence: z.enum(["NONE", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]).optional(),
  occurrences: z.coerce.number().int().min(1).max(26).optional(),
});

export const clubSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  location: z.string().min(2).max(120),
  region: z.string().max(80).optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  categories: z.string().max(200).optional().nullable(),
});

export const venueSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  address: z.string().min(2).max(200),
  city: z.string().min(2).max(80),
  postcode: z.string().max(12).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  amenities: z.string().max(300).optional().nullable(),
  categories: z.string().max(200).optional().nullable(),
});

export const reportSchema = z.object({
  targetType: z.enum(["EVENT", "REVIEW", "PHOTO"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(120),
  detail: z.string().max(1000).optional().nullable(),
});

export const adminUserSchema = z.object({
  role: z.enum(["ENTHUSIAST", "ORGANISER", "VENUE", "ADMIN"]).optional(),
  suspended: z.boolean().optional(),
});

export const adminEventSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
  featured: z.boolean().optional(),
});

export const adminReportSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ClubInput = z.infer<typeof clubSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
