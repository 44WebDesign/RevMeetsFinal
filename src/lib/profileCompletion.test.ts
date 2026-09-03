import { describe, it, expect } from "vitest";
import { computeProfileCompletion, type ProfileSignals } from "./profileCompletion";

const base: ProfileSignals = {
  id: "u1",
  name: "Ben",
  bio: null,
  carMake: null,
  carModel: null,
  homeLat: null,
  homeLng: null,
  hasBuildPhoto: false,
};

describe("computeProfileCompletion", () => {
  it("seeds progress from the always-done steps (endowed progress)", () => {
    const c = computeProfileCompletion(base);
    // account + name done out of 6
    expect(c.done).toBe(2);
    expect(c.total).toBe(6);
    expect(c.percent).toBe(33);
  });

  it("counts each completed signal", () => {
    const c = computeProfileCompletion({
      ...base,
      bio: "Love my Skyline",
      carMake: "Nissan",
      carModel: "Skyline",
      homeLat: 51.5,
      homeLng: -0.1,
      hasBuildPhoto: true,
    });
    expect(c.percent).toBe(100);
    expect(c.nextStep).toBeNull();
  });

  it("requires both make and model for the garage step", () => {
    const c = computeProfileCompletion({ ...base, carMake: "Nissan" });
    expect(c.steps.find((s) => s.key === "car")!.done).toBe(false);
  });

  it("treats whitespace-only bio/name as not done", () => {
    const c = computeProfileCompletion({ ...base, name: "   ", bio: "  " });
    expect(c.steps.find((s) => s.key === "name")!.done).toBe(false);
    expect(c.steps.find((s) => s.key === "bio")!.done).toBe(false);
  });

  it("points nextStep at the first incomplete actionable step", () => {
    const c = computeProfileCompletion(base);
    expect(c.nextStep?.key).toBe("bio");
    expect(c.nextStep?.href).toBe("/account");
  });

  it("links the build-photo step to the member profile", () => {
    const c = computeProfileCompletion(base);
    expect(c.steps.find((s) => s.key === "photo")!.href).toBe("/members/u1");
  });
});
