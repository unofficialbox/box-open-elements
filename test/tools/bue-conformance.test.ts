import { describe, expect, it } from "vitest";

import {
  compareValue,
  extractDeclarations,
  normalizeToken,
  parseLength,
  parseScssVariables,
  resolveScssValue,
} from "../../tools/bue-conformance/signals.js";

describe("parseLength", () => {
  it("parses px and rem (rem at 16px root)", () => {
    expect(parseLength("32px")).toEqual({ px: 32, raw: "32px" });
    expect(parseLength("1rem")).toEqual({ px: 16, raw: "1rem" });
    expect(parseLength("0.5rem")).toEqual({ px: 8, raw: "0.5rem" });
  });

  it("tolerates surrounding whitespace and decimals", () => {
    expect(parseLength("  6px ")?.px).toBe(6);
    expect(parseLength("12.5px")?.px).toBe(12.5);
  });

  it("returns null for non-length tokens", () => {
    expect(parseLength("100%")).toBeNull();
    expect(parseLength("auto")).toBeNull();
    expect(parseLength("rgb(0 0 0 / 5%)")).toBeNull();
    expect(parseLength("")).toBeNull();
  });
});

describe("parseScssVariables", () => {
  it("parses simple declarations and strips !default", () => {
    const vars = parseScssVariables(
      "$bdl-grid-unit: 4px !default;\n$bdl-btn-height: 32px;",
    );
    expect(vars.get("bdl-grid-unit")).toBe("4px");
    expect(vars.get("bdl-btn-height")).toBe("32px");
  });

  it("keeps arithmetic values verbatim and lets later declarations win", () => {
    const vars = parseScssVariables(
      "$r: 4px;\n$r-med: $r * 1.5;\n$r: 5px;",
    );
    expect(vars.get("r-med")).toBe("$r * 1.5");
    expect(vars.get("r")).toBe("5px");
  });

  it("returns an empty map when there are no declarations", () => {
    expect(parseScssVariables(".foo { color: red; }").size).toBe(0);
  });
});

describe("resolveScssValue", () => {
  const vars = parseScssVariables(
    "$bdl-border-radius-size: 4px;\n$grid: 4px;\n$alias: $grid;",
  );

  it("substitutes a bare variable reference", () => {
    expect(resolveScssValue("$bdl-border-radius-size", vars)).toBe("4px");
  });

  it("evaluates length * number arithmetic in either order", () => {
    expect(resolveScssValue("$bdl-border-radius-size * 1.5", vars)).toBe("6px");
    expect(resolveScssValue("3 * $bdl-border-radius-size", vars)).toBe("12px");
  });

  it("evaluates length / number arithmetic", () => {
    expect(resolveScssValue("$grid / 2", vars)).toBe("2px");
  });

  it("resolves chained variable aliases", () => {
    expect(resolveScssValue("$alias", vars)).toBe("4px");
  });

  it("passes non-arithmetic and unresolvable values through unchanged", () => {
    expect(resolveScssValue("30px", vars)).toBe("30px");
    expect(resolveScssValue("$unknown", vars)).toBe("$unknown");
    expect(resolveScssValue("0 1px 1px 1px black", vars)).toBe("0 1px 1px 1px black");
  });
});

describe("extractDeclarations", () => {
  const css = `
    .modal { padding: 30px; }
    .modal-content { width: 460px; border-radius: $bdl-border-radius-size-xlarge; }
    .other { width: 100%; padding-left: 8px; border-radius-inline: 2px; }
  `;

  it("extracts every value for a property in document order", () => {
    expect(extractDeclarations(css, "width")).toEqual(["460px", "100%"]);
  });

  it("respects property boundaries (no padding-left / -inline bleed)", () => {
    expect(extractDeclarations(css, "padding")).toEqual(["30px"]);
    expect(extractDeclarations(css, "border-radius")).toEqual([
      "$bdl-border-radius-size-xlarge",
    ]);
  });

  it("returns an empty array when the property is absent", () => {
    expect(extractDeclarations(css, "margin")).toEqual([]);
  });
});

describe("compareValue", () => {
  it("marks matching lengths conformant", () => {
    expect(compareValue({ boeValue: "12px", upstreamValue: "12px" }).verdict).toBe(
      "conformant",
    );
  });

  it("marks mismatched lengths as drift with a delta", () => {
    const result = compareValue({ boeValue: "12px", upstreamValue: "8px" });
    expect(result.verdict).toBe("drift");
    expect(result.deltaPx).toBe(4);
  });

  it("honours a pixel tolerance", () => {
    expect(
      compareValue({ boeValue: "12px", upstreamValue: "13px", tolerancePx: 1 }).verdict,
    ).toBe("conformant");
    expect(
      compareValue({ boeValue: "12px", upstreamValue: "14px", tolerancePx: 1 }).verdict,
    ).toBe("drift");
  });

  it("flags missing upstream values", () => {
    expect(compareValue({ boeValue: "12px", upstreamValue: null }).verdict).toBe(
      "missing-upstream",
    );
    expect(compareValue({ boeValue: "12px", upstreamValue: "   " }).verdict).toBe(
      "missing-upstream",
    );
  });

  it("routes non-length values to review unless they match exactly", () => {
    expect(
      compareValue({
        boeValue: "0 4px 12px 0 rgb(0 0 0 / 10%)",
        upstreamValue: "0 1px 1px 1px fade-out($black, 0.95)",
      }).verdict,
    ).toBe("review");
    expect(
      compareValue({ boeValue: "PILL", upstreamValue: "pill" }).verdict,
    ).toBe("conformant");
  });
});

describe("normalizeToken", () => {
  it("collapses whitespace and lowercases", () => {
    expect(normalizeToken("  Foo   Bar ")).toBe("foo bar");
  });
});
