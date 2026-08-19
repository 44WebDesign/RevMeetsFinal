import { describe, it, expect } from "vitest";
import { eventSchema, profileSchema, reportSchema } from "./validation";

describe("eventSchema", () => {
  const base = {
    title: "Sunday Meet",
    description: "A relaxed cars & coffee morning.",
    type: "MEET",
    startsAt: "2026-09-01T09:00",
    city: "Leeds",
    lat: 53.8,
    lng: -1.5,
  };
  it("accepts a valid event and coerces numeric strings", () => {
    const parsed = eventSchema.parse({ ...base, lat: "53.8", lng: "-1.5", capacity: "50" });
    expect(parsed.capacity).toBe(50);
    expect(parsed.lat).toBe(53.8);
  });
  it("rejects an unknown event type", () => {
    expect(() => eventSchema.parse({ ...base, type: "RAVE" })).toThrow();
  });
  it("rejects out-of-range coordinates", () => {
    expect(() => eventSchema.parse({ ...base, lat: 200 })).toThrow();
  });
  it("rejects a too-short title", () => {
    expect(() => eventSchema.parse({ ...base, title: "x" })).toThrow();
  });
});

describe("profileSchema (garage)", () => {
  it("accepts a full garage", () => {
    const p = profileSchema.parse({ name: "Ben", carMake: "Nissan", carModel: "Skyline", carYear: 1999 });
    expect(p.carYear).toBe(1999);
  });
  it("allows a null car year", () => {
    const p = profileSchema.parse({ name: "Ben", carYear: null });
    expect(p.carYear).toBeNull();
  });
  it("rejects an implausible car year", () => {
    expect(() => profileSchema.parse({ name: "Ben", carYear: 1200 })).toThrow();
  });
  it("rejects a bad avatar colour", () => {
    expect(() => profileSchema.parse({ name: "Ben", avatarColor: "red" })).toThrow();
  });
});

describe("reportSchema", () => {
  it("accepts a PHOTO report", () => {
    const r = reportSchema.parse({ targetType: "PHOTO", targetId: "abc", reason: "Offensive or inappropriate" });
    expect(r.targetType).toBe("PHOTO");
  });
  it("accepts EVENT and REVIEW reports", () => {
    expect(reportSchema.parse({ targetType: "EVENT", targetId: "e", reason: "Spam" }).targetType).toBe("EVENT");
    expect(reportSchema.parse({ targetType: "REVIEW", targetId: "r", reason: "Spam" }).targetType).toBe("REVIEW");
  });
  it("rejects an unknown target type", () => {
    expect(() => reportSchema.parse({ targetType: "USER", targetId: "u", reason: "Spam" })).toThrow();
  });
});
