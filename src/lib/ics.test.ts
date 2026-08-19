import { describe, it, expect } from "vitest";
import { icsStamp, escapeIcs, foldLine, buildCalendar } from "./ics";

describe("icsStamp", () => {
  it("formats a UTC calendar timestamp with no separators", () => {
    expect(icsStamp(new Date("2026-08-15T10:00:00Z"))).toBe("20260815T100000Z");
  });
});

describe("escapeIcs", () => {
  it("escapes commas, semicolons, backslashes and newlines", () => {
    expect(escapeIcs("Cars, Coffee; A\\B\nnext")).toBe("Cars\\, Coffee\\; A\\\\B\\nnext");
  });
});

describe("foldLine", () => {
  it("leaves short lines untouched", () => {
    expect(foldLine("SUMMARY:Hi")).toBe("SUMMARY:Hi");
  });
  it("folds long lines with CRLF + space and keeps chunks <=75", () => {
    const long = "DESCRIPTION:" + "x".repeat(200);
    const folded = foldLine(long);
    expect(folded).toContain("\r\n ");
    for (const seg of folded.split("\r\n")) {
      expect(seg.length).toBeLessThanOrEqual(75);
    }
  });
});

describe("buildCalendar", () => {
  const cal = buildCalendar("RevMeet — Leeds", [
    {
      uid: "e1@revmeet",
      title: "Sunday Meet",
      description: "Cars & coffee",
      location: "Leeds",
      start: new Date("2026-09-01T09:00:00Z"),
      end: new Date("2026-09-01T12:00:00Z"),
      url: "https://revmeet.example/events/sunday-meet",
    },
  ]);

  it("wraps events in a VCALENDAR with required headers", () => {
    expect(cal.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(cal.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(cal).toContain("VERSION:2.0");
    expect(cal).toContain("X-WR-CALNAME:RevMeet — Leeds");
  });
  it("emits a VEVENT with stamps and fields", () => {
    expect(cal).toContain("BEGIN:VEVENT");
    expect(cal).toContain("UID:e1@revmeet");
    expect(cal).toContain("DTSTART:20260901T090000Z");
    expect(cal).toContain("DTEND:20260901T120000Z");
    expect(cal).toContain("SUMMARY:Sunday Meet");
    expect(cal).toContain("END:VEVENT");
  });
  it("uses CRLF line endings", () => {
    expect(cal).toContain("\r\n");
  });
  it("defaults the end time to +2h when none is given", () => {
    const c = buildCalendar("x", [{ uid: "u", title: "t", start: new Date("2026-09-01T09:00:00Z") }]);
    expect(c).toContain("DTEND:20260901T110000Z");
  });
  it("escapes commas in the summary", () => {
    const c = buildCalendar("x", [{ uid: "u", title: "Cars, Coffee", start: new Date("2026-09-01T09:00:00Z") }]);
    expect(c).toContain("SUMMARY:Cars\\, Coffee");
  });
});
