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
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ClubInput = z.infer<typeof clubSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
