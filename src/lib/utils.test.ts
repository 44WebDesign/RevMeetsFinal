import { describe, it, expect } from "vitest";
import { slugify, citySlug, uniqueSlug, distanceKm, initials, formatDate } from "./utils";

describe("slugify", () => {
  it("lowercases, strips punctuation and collapses spaces", () => {
    expect(slugify("  JDM Meet: Night Cruise!! ")).toBe("jdm-meet-night-cruise");
  });
  it("collapses repeated hyphens", () => {
    expect(slugify("A -- B")).toBe("a-b");
  });
  it("caps length at 80 chars", () => {
    expect(slugify("x".repeat(200)).length).toBe(80);
  });
});

describe("citySlug", () => {
  it("lowercases and hyphenates", () => {
    expect(citySlug("Milton Keynes")).toBe("milton-keynes");
  });
});

describe("uniqueSlug", () => {
  it("keeps a base and appends a suffix", () => {
    const s = uniqueSlug("Cars & Coffee");
    expect(s).toMatch(/^cars-coffee-[a-z0-9]{5}$/);
  });
  it("falls back to 'item' for empty input", () => {
    expect(uniqueSlug("!!!")).toMatch(/^item-[a-z0-9]{5}$/);
  });
  it("produces different suffixes on repeat calls", () => {
    expect(uniqueSlug("meet")).not.toBe(uniqueSlug("meet"));
  });
});

describe("distanceKm", () => {
  it("is ~0 for identical points", () => {
    expect(distanceKm(51.5, -0.1, 51.5, -0.1)).toBeCloseTo(0, 5);
  });
  it("London → Paris is roughly 340km", () => {
    const d = distanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(355);
  });
  it("is symmetric", () => {
    const a = distanceKm(53.8, -1.5, 55.9, -3.2);
    const b = distanceKm(55.9, -3.2, 53.8, -1.5);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Ben Meredith")).toBe("BM");
  });
  it("handles single names", () => {
    expect(initials("Ben")).toBe("B");
  });
});

describe("formatDate", () => {
  it("formats an ISO string in en-GB", () => {
    expect(formatDate("2026-08-15T10:00:00Z")).toMatch(/15 Aug 2026/);
  });
});
