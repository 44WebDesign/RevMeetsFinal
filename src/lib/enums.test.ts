import { describe, it, expect } from "vitest";
import {
  EVENT_TYPES,
  EVENT_TYPE_SLUGS,
  eventTypeFromSlug,
  eventTypeLabel,
  eventTypeColor,
  REPORT_TARGETS,
} from "./enums";

describe("event type slugs", () => {
  it("round-trips every type through its slug", () => {
    for (const type of EVENT_TYPES) {
      const slug = EVENT_TYPE_SLUGS[type];
      expect(eventTypeFromSlug(slug)).toBe(type);
    }
  });
  it("returns null for an unknown slug", () => {
    expect(eventTypeFromSlug("not-a-real-slug")).toBeNull();
  });
});

describe("labels & colours", () => {
  it("labels a known type", () => {
    expect(eventTypeLabel("TRACK_DAY")).toBe("Track Day");
  });
  it("falls back to the raw value for unknown types", () => {
    expect(eventTypeLabel("MYSTERY")).toBe("MYSTERY");
    expect(eventTypeColor("MYSTERY")).toBe("#FF5F1F");
  });
});

describe("report targets", () => {
  it("includes PHOTO so user photos are moderatable", () => {
    expect(REPORT_TARGETS).toContain("PHOTO");
    expect(REPORT_TARGETS).toContain("EVENT");
    expect(REPORT_TARGETS).toContain("REVIEW");
  });
});
