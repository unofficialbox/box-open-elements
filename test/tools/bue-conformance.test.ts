import { describe, expect, it } from "vitest";

import {
  compareValue,
  extractDeclarations,
  extractScopedDeclarations,
  normalizeToken,
  parseLength,
  parseScssVariables,
  resolveScssValue,
  stripScssComments,
} from "../../tools/bue-conformance/signals.js";
import {
  computeExitCode,
  evaluate,
  extractUpstream,
  parseArgs,
  renderMarkdown,
  type LoadedFile,
} from "../../tools/bue-conformance/audit.js";

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

describe("stripScssComments", () => {
  it("removes line and block comments", () => {
    expect(stripScssComments("a; // gone\nb;")).toBe("a; \nb;");
    expect(stripScssComments("a;/* gone */b;")).toBe("a;b;");
  });

  it("preserves comment-like text inside quoted strings", () => {
    expect(stripScssComments('content: "a // b";')).toBe('content: "a // b";');
    expect(stripScssComments("content: 'x /* y */ z';")).toBe(
      "content: 'x /* y */ z';",
    );
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

  it("ignores commented-out declarations (both comment styles)", () => {
    const vars = parseScssVariables(
      "$h: 32px;\n// $h: 99px;\n/* $h: 88px; */",
    );
    expect(vars.get("h")).toBe("32px");
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

  it("leaves length × length unresolved (not a concrete CSS length)", () => {
    expect(resolveScssValue("2px * 3rem", vars)).toBe("2px * 3rem");
    // Unitless × length still resolves.
    expect(resolveScssValue("2 * 3px", vars)).toBe("6px");
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

describe("extractScopedDeclarations", () => {
  // Mirrors the real Modal.scss shape: an animation-only nested `.modal-dialog`,
  // a look-alike `.modal-dialog-container`, then the real `.modal-dialog`.
  const modalScss = `
    .modal {
      padding: 30px;
      .modal-dialog { box-shadow: none; }
    }
    .modal-dialog-container { width: 100%; }
    .modal-dialog {
      width: 460px;
      padding: 30px;
      border-radius: $bdl-border-radius-size-xlarge;
    }
  `;

  it("reads only the matching rule, skipping the empty same-named block", () => {
    expect(extractScopedDeclarations(modalScss, ".modal-dialog", "width")).toEqual([
      "460px",
    ]);
    expect(
      extractScopedDeclarations(modalScss, ".modal-dialog", "border-radius"),
    ).toEqual(["$bdl-border-radius-size-xlarge"]);
  });

  it("does not leak declarations from an unrelated look-alike selector", () => {
    // `.modal-dialog-container` width:100% must not be attributed to `.modal-dialog`.
    expect(extractScopedDeclarations(modalScss, ".modal-dialog", "padding")).toEqual([
      "30px",
    ]);
  });

  it("matches a pseudo/combinator suffix but not a longer name", () => {
    const css = ".menu-item:hover { min-height: 5px; }";
    expect(extractScopedDeclarations(css, ".menu-item", "min-height")).toEqual([
      "5px",
    ]);
    expect(
      extractScopedDeclarations(".menu-item-icon { min-height: 9px; }", ".menu-item", "min-height"),
    ).toEqual([]);
  });

  it("ignores commented-out declarations within the scope", () => {
    const css = ".menu-item { /* min-height: 99px; */ min-height: 30px; }";
    expect(extractScopedDeclarations(css, ".menu-item", "min-height")).toEqual([
      "30px",
    ]);
  });

  it("treats a brace inside a quoted value as text, not structure", () => {
    const css = `.menu-item { content: "{"; min-height: 30px; }`;
    expect(extractScopedDeclarations(css, ".menu-item", "min-height")).toEqual([
      "30px",
    ]);
  });

  it("does not match a descendant rule as the target element", () => {
    const css = ".menu-item .icon { min-height: 9px; }";
    expect(extractScopedDeclarations(css, ".menu-item", "min-height")).toEqual([]);
  });

  it("still matches same-subject compound/state suffixes", () => {
    const css = ".menu-item.active { min-height: 7px; } .menu-item[aria-current] { min-height: 8px; }";
    expect(extractScopedDeclarations(css, ".menu-item", "min-height")).toEqual([
      "7px",
      "8px",
    ]);
  });
});

describe("normalizeToken", () => {
  it("collapses whitespace and lowercases", () => {
    expect(normalizeToken("  Foo   Bar ")).toBe("foo bar");
  });
});

describe("audit workflow", () => {
  // Synthetic upstream mirroring the manifest's real variable names + selectors,
  // so evaluate() exercises the actual CLAIMS incl. cross-file resolution.
  const conformantFiles = (): LoadedFile[] => [
    {
      id: "layout",
      path: "layout",
      content: [
        "$bdl-grid-unit: 4px !default;",
        "$bdl-border-radius-size: 4px;",
        "$bdl-border-radius-size-med: $bdl-border-radius-size * 1.5;",
        "$bdl-border-radius-size-large: $bdl-border-radius-size * 2;",
        "$bdl-border-radius-size-xlarge: $bdl-border-radius-size * 3;",
      ].join("\n"),
    },
    {
      id: "buttons",
      path: "buttons",
      content: [
        "$bdl-btn-height: 32px;",
        "$bdl-btn-height-large: 40px;",
        "$bdl-btn-padding-horizontal: $bdl-grid-unit * 4;",
      ].join("\n"),
    },
    {
      id: "modal",
      path: "modal",
      content:
        ".modal-dialog { width: 460px; padding: 30px; border-radius: $bdl-border-radius-size-xlarge; }",
    },
    { id: "menu", path: "menu", content: ".menu-item { min-height: 30px; }" },
  ];

  it("parseArgs reads the run flags", () => {
    expect(parseArgs([])).toEqual({ refresh: false, offline: false, strict: false });
    expect(parseArgs(["--refresh", "--offline", "--strict"])).toEqual({
      refresh: true,
      offline: true,
      strict: true,
    });
  });

  it("extractUpstream resolves scss-var and scoped decl claims", () => {
    const byId = new Map<string, string | null>([
      ["buttons", "$bdl-btn-height: 32px;"],
      ["modal", ".modal-dialog { width: 460px; }"],
    ]);
    expect(
      extractUpstream(
        { extractor: { kind: "scss-var", file: "buttons", name: "bdl-btn-height" } } as never,
        byId,
      ),
    ).toBe("32px");
    expect(
      extractUpstream(
        {
          extractor: {
            kind: "decl",
            file: "modal",
            selector: ".modal-dialog",
            property: "width",
          },
        } as never,
        byId,
      ),
    ).toBe("460px");
    expect(
      extractUpstream(
        { extractor: { kind: "scss-var", file: "absent", name: "x" } } as never,
        byId,
      ),
    ).toBeNull();
  });

  it("evaluate marks every claim conformant against faithful upstream", () => {
    const rows = evaluate(conformantFiles());
    expect(rows.length).toBeGreaterThanOrEqual(12);
    expect(rows.every(r => r.verdict === "conformant")).toBe(true);
    // Cross-file resolution: modal radius resolves via the layout var map.
    const modalRadius = rows.find(r => r.claim.id === "overlay.modalRadius");
    expect(modalRadius?.upstreamResolved).toBe("12px");
  });

  it("evaluate flags drift and missing-upstream", () => {
    const files = conformantFiles();
    files[1] = { id: "buttons", path: "buttons", content: "$bdl-btn-height: 30px;\n$bdl-btn-height-large: 40px;\n$bdl-btn-padding-horizontal: $bdl-grid-unit * 4;" };
    files[3] = { id: "menu", path: "menu", content: null };
    const rows = evaluate(files);
    expect(rows.find(r => r.claim.id === "control.height")?.verdict).toBe("drift");
    expect(rows.find(r => r.claim.id === "overlay.itemMinHeight")?.verdict).toBe(
      "missing-upstream",
    );
  });

  it("computeExitCode fails strict mode on any non-conformant verdict", () => {
    const rows = evaluate(conformantFiles());
    expect(computeExitCode(rows, false)).toBe(0);
    expect(computeExitCode(rows, true)).toBe(0);

    const drifted = evaluate(
      conformantFiles().map(f =>
        f.id === "menu" ? { ...f, content: null } : f,
      ),
    );
    expect(computeExitCode(drifted, false)).toBe(0);
    expect(computeExitCode(drifted, true)).toBe(1);
  });

  it("renderMarkdown reports a verdict summary", () => {
    const md = renderMarkdown(evaluate(conformantFiles()), conformantFiles());
    expect(md).toContain("# box-ui-elements Geometry Conformance Audit");
    expect(md).toMatch(/✅ Conformant \| 12/);
  });
});
