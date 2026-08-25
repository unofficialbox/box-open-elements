import { describe, expect, it } from "vitest";

import {
  parseInstant,
  parseNumber,
  resolveByteUnits,
  resolveDateStyle,
  resolveFileSizeParts,
  resolveLocale,
  resolveRelativeParts,
} from "../../src/foundations/format/index.js";

describe("resolveLocale", () => {
  it("returns undefined so Intl uses the host's locale", () => {
    // The distinction matters: substituting "en-US" would silently render
    // American dates to a German reader.
    expect(resolveLocale(null)).toBeUndefined();
    expect(resolveLocale("")).toBeUndefined();
    expect(resolveLocale("   ")).toBeUndefined();
  });

  it("passes a real tag through, trimmed", () => {
    expect(resolveLocale(" de-DE ")).toBe("de-DE");
  });
});

describe("parseInstant", () => {
  it("accepts ISO strings and epoch milliseconds alike", () => {
    expect(parseInstant("2026-08-25T12:00:00.000Z")?.toISOString()).toBe(
      "2026-08-25T12:00:00.000Z",
    );
    expect(parseInstant(1_700_000_000_000)?.getTime()).toBe(1_700_000_000_000);
  });

  it("reads a numeric string as epoch milliseconds, not as a year", () => {
    // new Date("1700000000000") is not the same instant as
    // new Date(1700000000000) — the string form is parsed as a date string.
    expect(parseInstant("1700000000000")?.getTime()).toBe(1_700_000_000_000);
  });

  it("returns null rather than an Invalid Date", () => {
    for (const bad of [null, undefined, "", "banana", Number.NaN, Infinity]) {
      expect(parseInstant(bad as string)).toBeNull();
    }
  });
});

describe("parseNumber", () => {
  it("returns null for anything non-finite", () => {
    expect(parseNumber("12.5")).toBe(12.5);
    expect(parseNumber(0)).toBe(0);
    for (const bad of [null, undefined, "", "banana", Number.NaN, Infinity]) {
      expect(parseNumber(bad as string)).toBeNull();
    }
  });
});

describe("resolveDateStyle", () => {
  it("omits an unrecognised style rather than substituting one", () => {
    expect(resolveDateStyle("medium")).toBe("medium");
    expect(resolveDateStyle("enormous")).toBeUndefined();
    expect(resolveDateStyle(null)).toBeUndefined();
  });
});

describe("resolveRelativeParts", () => {
  const at = (iso: string): Date => new Date(iso);
  const reference = at("2026-08-25T12:00:00Z");

  it("picks the largest unit that yields a whole number", () => {
    expect(resolveRelativeParts(at("2026-08-21T12:00:00Z"), reference)).toEqual({
      unit: "day",
      value: -4,
    });
    expect(resolveRelativeParts(at("2026-08-25T11:30:00Z"), reference)).toEqual({
      unit: "minute",
      value: -30,
    });
  });

  it("signs the past negative, matching Intl.RelativeTimeFormat", () => {
    expect(resolveRelativeParts(at("2026-08-26T12:00:00Z"), reference).value).toBeGreaterThan(0);
    expect(resolveRelativeParts(at("2026-08-24T12:00:00Z"), reference).value).toBeLessThan(0);
  });

  it("truncates rather than rounds, so a label never claims a boundary early", () => {
    // 47 hours is "1 day ago". Rounding would make it 2, crossing a boundary
    // the instant has not reached.
    expect(resolveRelativeParts(at("2026-08-23T13:00:00Z"), reference)).toEqual({
      unit: "day",
      value: -1,
    });
  });

  it("floors at seconds rather than reporting a sub-second unit", () => {
    expect(resolveRelativeParts(at("2026-08-25T12:00:00.400Z"), reference)).toEqual({
      unit: "second",
      value: 0,
    });
  });
});

describe("resolveFileSizeParts", () => {
  it("defaults to decimal units, matching what the Box product reports", () => {
    expect(resolveByteUnits(null)).toBe("decimal");
    expect(resolveFileSizeParts(2_500_000)).toEqual({ suffix: "MB", value: 2.5 });
  });

  it("switches to IEC names on binary units", () => {
    expect(resolveFileSizeParts(1_048_576, "binary")).toEqual({ suffix: "MiB", value: 1 });
  });

  it("reports bytes whole, because 1.5 B is nonsense", () => {
    expect(resolveFileSizeParts(512)).toEqual({ suffix: "B", value: 512 });
    expect(resolveFileSizeParts(999.7)).toEqual({ suffix: "B", value: 999 });
  });

  it("keeps the largest name it has rather than running off the table", () => {
    expect(resolveFileSizeParts(1e21).suffix).toBe("PB");
  });

  it("handles zero without taking a logarithm of it", () => {
    expect(resolveFileSizeParts(0)).toEqual({ suffix: "B", value: 0 });
  });
});
