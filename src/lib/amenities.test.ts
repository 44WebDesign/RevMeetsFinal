import { describe, it, expect } from "vitest";
import {
  parseAmenities,
  amenityKeys,
  serializeAmenities,
  hasAllAmenities,
  parseAmenityParam,
} from "./amenities";

describe("parseAmenities", () => {
  it("resolves canonical keys with labels and icons", () => {
    const out = parseAmenities("PARKING,FOOD");
    expect(out.map((a) => a.key)).toEqual(["PARKING", "FOOD"]);
    expect(out[0].label).toBe("Parking");
    expect(out.every((a) => a.known)).toBe(true);
  });
  it("matches legacy free-text by label (case-insensitive)", () => {
    const out = parseAmenities("parking, Hot Food");
    expect(out.map((a) => a.key)).toEqual(["PARKING", "FOOD"]);
  });
  it("keeps unknown tokens as-is but marks them unknown", () => {
    const out = parseAmenities("PARKING,Helipad");
    expect(out[1].known).toBe(false);
    expect(out[1].label).toBe("Helipad");
  });
  it("de-duplicates repeated amenities", () => {
    expect(parseAmenities("PARKING,PARKING,Parking")).toHaveLength(1);
  });
  it("returns [] for empty/nullish input", () => {
    expect(parseAmenities("")).toEqual([]);
    expect(parseAmenities(null)).toEqual([]);
    expect(parseAmenities(undefined)).toEqual([]);
  });
});

describe("amenityKeys / serializeAmenities", () => {
  it("drops unknown tokens", () => {
    expect(amenityKeys("PARKING,Helipad,DYNO")).toEqual(["PARKING", "DYNO"]);
  });
  it("round-trips known keys", () => {
    expect(serializeAmenities(["PARKING", "DYNO"])).toBe("PARKING,DYNO");
  });
  it("serialize ignores unknown keys", () => {
    expect(serializeAmenities(["PARKING", "NOPE"])).toBe("PARKING");
  });
});

describe("hasAllAmenities", () => {
  it("true when every requested key is present", () => {
    expect(hasAllAmenities("PARKING,FOOD,DYNO", ["PARKING", "DYNO"])).toBe(true);
  });
  it("false when any requested key is missing", () => {
    expect(hasAllAmenities("PARKING", ["PARKING", "DYNO"])).toBe(false);
  });
  it("empty selection matches everything", () => {
    expect(hasAllAmenities("", [])).toBe(true);
    expect(hasAllAmenities(null, [])).toBe(true);
  });
});

describe("parseAmenityParam", () => {
  it("sanitizes a query param down to known keys", () => {
    expect(parseAmenityParam("PARKING,bogus,DYNO")).toEqual(["PARKING", "DYNO"]);
    expect(parseAmenityParam(null)).toEqual([]);
  });
});
