// Shared enum-like constants + labels. SQLite has no native enums, so these
// string unions are the single source of truth used by Zod and the UI.

export const ROLES = ["ENTHUSIAST", "ORGANISER", "VENUE", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const EVENT_TYPES = [
  "CAR_SHOW",
  "TRACK_DAY",
  "NIGHT_CRUISE",
  "DRIFT_EVENT",
  "STANCE_MEET",
  "JDM_MEET",
  "CLASSIC_CARS",
  "SUPERCAR_MEET",
  "MEET",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CAR_SHOW: "Car Show",
  TRACK_DAY: "Track Day",
  NIGHT_CRUISE: "Night Cruise",
  DRIFT_EVENT: "Drift Event",
  STANCE_MEET: "Stance Meet",
  JDM_MEET: "JDM Meet",
  CLASSIC_CARS: "Classic Cars",
  SUPERCAR_MEET: "Supercar Meet",
  MEET: "Meet",
};

// Marker / badge colour per event type (mirrors the original design legend).
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  CAR_SHOW: "#FF5F1F",
  TRACK_DAY: "#E040FB",
  NIGHT_CRUISE: "#00BCD4",
  DRIFT_EVENT: "#FFD700",
  STANCE_MEET: "#4CAF50",
  JDM_MEET: "#2196F3",
  CLASSIC_CARS: "#B0BEC5",
  SUPERCAR_MEET: "#F44336",
  MEET: "#4CAF50",
};

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type as EventType] ?? type;
}

export function eventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type as EventType] ?? "#FF5F1F";
}

export const ROLE_LABELS: Record<Role, string> = {
  ENTHUSIAST: "Car Enthusiast",
  ORGANISER: "Event Host / Club",
  VENUE: "Venue",
  ADMIN: "Admin",
};
