import { describe, it, expect } from "vitest";
import { addRecent, parseRecent, type RecentEvent } from "./recentViews";

const ev = (slug: string): RecentEvent => ({
  slug,
  title: `Event ${slug}`,
  city: "Leeds",
  type: "MEET",
  startsAt: "2026-09-01T09:00:00Z",
});

describe("addRecent", () => {
  it("prepends the newest event", () => {
    const out = addRecent([ev("a")], ev("b"));
    expect(out.map((e) => e.slug)).toEqual(["b", "a"]);
  });
  it("de-duplicates by slug, moving it to the front", () => {
    const out = addRecent([ev("a"), ev("b")], ev("a"));
    expect(out.map((e) => e.slug)).toEqual(["a", "b"]);
    expect(out).toHaveLength(2);
  });
  it("caps the list length", () => {
    let list: RecentEvent[] = [];
    for (let i = 0; i < 15; i++) list = addRecent(list, ev(`e${i}`), 10);
    expect(list).toHaveLength(10);
    expect(list[0].slug).toBe("e14"); // most recent first
  });
});

describe("parseRecent", () => {
  it("returns [] for null / bad JSON / non-arrays", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("{oops")).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
  });
  it("keeps only well-formed entries", () => {
    const raw = JSON.stringify([ev("a"), { slug: 1 }, { title: "x" }]);
    expect(parseRecent(raw).map((e) => e.slug)).toEqual(["a"]);
  });
});
