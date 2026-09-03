import { describe, it, expect } from "vitest";
import { dateProximity, spacesLeft, isFillingUp } from "./urgency";

const now = new Date("2026-09-02T10:00:00Z"); // a Wednesday

describe("dateProximity", () => {
  it("labels today and tomorrow as urgent", () => {
    expect(dateProximity("2026-09-02T18:00:00Z", now)).toEqual({ label: "Today", urgent: true });
    expect(dateProximity("2026-09-03T09:00:00Z", now)).toEqual({ label: "Tomorrow", urgent: true });
  });
  it("labels a near Saturday as 'This weekend'", () => {
    // 2026-09-05 is a Saturday, 3 days out
    expect(dateProximity("2026-09-05T09:00:00Z", now)).toEqual({ label: "This weekend", urgent: false });
  });
  it("labels other near days as 'In N days'", () => {
    // 2026-09-09 is a Wednesday, 7 days out
    expect(dateProximity("2026-09-09T09:00:00Z", now)).toEqual({ label: "In 7 days", urgent: false });
  });
  it("returns null for far-off events", () => {
    expect(dateProximity("2026-10-01T09:00:00Z", now)).toBeNull();
  });
  it("returns null for events that already happened", () => {
    expect(dateProximity("2026-09-01T09:00:00Z", now)).toBeNull();
  });
});

describe("spacesLeft", () => {
  it("computes remaining capacity", () => {
    expect(spacesLeft(50, 42)).toBe(8);
  });
  it("never goes negative", () => {
    expect(spacesLeft(50, 60)).toBe(0);
  });
  it("is null with no capacity", () => {
    expect(spacesLeft(null, 10)).toBeNull();
    expect(spacesLeft(0, 10)).toBeNull();
  });
});

describe("isFillingUp", () => {
  it("true when within 15% (or 5) of the cap", () => {
    expect(isFillingUp(100, 90)).toBe(true); // 10 left, threshold 15
    expect(isFillingUp(20, 17)).toBe(true); // 3 left, threshold max(5, 3)=5
  });
  it("false when plenty of room", () => {
    expect(isFillingUp(100, 40)).toBe(false);
  });
  it("false when already full or uncapped", () => {
    expect(isFillingUp(50, 50)).toBe(false);
    expect(isFillingUp(null, 5)).toBe(false);
  });
});
