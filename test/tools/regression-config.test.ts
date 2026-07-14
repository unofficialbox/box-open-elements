import { describe, expect, it } from "vitest";

import { DEFAULT_MAX_DIFF_RATIO, parseMaxDiffRatio } from "../../tools/preview/regression-config.js";

describe("parseMaxDiffRatio", () => {
  it("returns the default when the override is unset", () => {
    expect(parseMaxDiffRatio(undefined)).toBe(DEFAULT_MAX_DIFF_RATIO);
  });

  it("parses valid numeric overrides across the [0, 1] range", () => {
    expect(parseMaxDiffRatio("0.02")).toBe(0.02);
    expect(parseMaxDiffRatio("0")).toBe(0);
    expect(parseMaxDiffRatio("1")).toBe(1);
    expect(parseMaxDiffRatio("  0.005  ")).toBe(0.005);
  });

  it("throws on invalid input so it cannot silently disable the gate", () => {
    expect(() => parseMaxDiffRatio("")).toThrow();
    expect(() => parseMaxDiffRatio("   ")).toThrow();
    expect(() => parseMaxDiffRatio("abc")).toThrow();
    expect(() => parseMaxDiffRatio("NaN")).toThrow();
    expect(() => parseMaxDiffRatio("Infinity")).toThrow();
    expect(() => parseMaxDiffRatio("-0.1")).toThrow();
  });

  it("throws on ratios above 1 (a diff ratio can never exceed 1)", () => {
    expect(() => parseMaxDiffRatio("1.0001")).toThrow();
    expect(() => parseMaxDiffRatio("2")).toThrow();
  });
});
