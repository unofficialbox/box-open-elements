import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canonicalColor,
  colorDelta,
  compareColor,
  extractColor,
  mixColors,
  normalizeShadow,
  parseColor,
  parseColorMix,
  resolveCssVars,
  splitTopLevel,
} from "../../tools/bue-conformance/color-signals.js";
import {
  extractBundleCss,
  extractCompiledDeclarations,
  extractRawDeclarations,
  parseChunkNames,
  partMatches,
  stripCssComments,
} from "../../tools/bue-conformance/css-extract.js";
import {
  anchorPresent,
  computeExitCode,
  evaluate,
  parseArgs,
  parseBundleNames,
  renderMarkdown,
  type Row,
} from "../../tools/bue-conformance/color-audit.js";
import {
  COLOR_CLAIMS,
  buildTokenMap,
  tokenToVarName,
  type ColorClaim,
} from "../../tools/bue-conformance/color-manifest.js";

// ---------------------------------------------------------------------------
// color-signals
// ---------------------------------------------------------------------------

describe("parseColor", () => {
  it("parses 6- and 3-digit hex", () => {
    expect(parseColor("#0061d5")).toEqual({ r: 0, g: 97, b: 213, a: 1 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("parses hex with alpha (8- and 4-digit)", () => {
    expect(parseColor("#000000ff")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    const half = parseColor("#00000080");
    expect(half?.a).toBeCloseTo(128 / 255, 5);
    expect(parseColor("#f00c")?.a).toBeCloseTo(204 / 255, 5);
  });

  it("parses legacy rgb()/rgba() with commas", () => {
    expect(parseColor("rgb(0, 97, 213)")).toEqual({ r: 0, g: 97, b: 213, a: 1 });
    expect(parseColor("rgba(0,0,0,.1)")).toEqual({ r: 0, g: 0, b: 0, a: 0.1 });
  });

  it("parses modern space-separated rgb(r g b / a)", () => {
    expect(parseColor("rgb(255 255 255 / 80%)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 0.8,
    });
    expect(parseColor("rgb(0 0 0 / 10%)")).toEqual({ r: 0, g: 0, b: 0, a: 0.1 });
  });

  it("parses the named colours the audit needs", () => {
    expect(parseColor("white")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("black")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it("returns null for non-colours", () => {
    expect(parseColor("color-mix(in srgb, red, blue)")).toBeNull();
    expect(parseColor("16px")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("#12")).toBeNull();
  });
});

describe("canonicalColor + colorDelta", () => {
  it("makes equal colours compare equal regardless of syntax", () => {
    const a = parseColor("#fff")!;
    const b = parseColor("rgb(255 255 255 / 100%)")!;
    expect(canonicalColor(a)).toBe(canonicalColor(b));
    expect(colorDelta(a, b)).toBe(0);
  });

  it("reports the max per-channel difference", () => {
    expect(colorDelta(parseColor("#004eaa")!, parseColor("#004eac")!)).toBe(2);
    expect(colorDelta(parseColor("#0057c0")!, parseColor("#0074fe")!)).toBe(62);
  });

  it("scales alpha onto the 0-255 channel scale", () => {
    expect(colorDelta(parseColor("#000")!, parseColor("#00000000")!)).toBe(255);
  });
});

describe("extractColor", () => {
  it("pulls the colour out of a shorthand value", () => {
    expect(canonicalColor(extractColor("1px solid #0061d5")!)).toBe(
      "rgba(0, 97, 213, 1)",
    );
  });

  it("returns null when there is no colour", () => {
    expect(extractColor("1px solid")).toBeNull();
  });

  it("evaluates a resolved color-mix and defers unresolved ones", () => {
    expect(canonicalColor(extractColor("color-mix(in srgb, #ffffff 97%, black 3%)")!)).toBe(
      "rgba(247, 247, 247, 1)",
    );
    // Operand still a var (unresolved) or a gradient → deferred to review.
    expect(extractColor("color-mix(in srgb, var(--x) 8%, transparent)")).toBeNull();
    expect(extractColor("linear-gradient(#fff, #000)")).toBeNull();
  });
});

describe("mixColors + parseColorMix", () => {
  it("mixes opaque colours in sRGB", () => {
    const mid = mixColors(parseColor("#000")!, 50, parseColor("#fff")!, 50)!;
    expect(canonicalColor(mid)).toBe("rgba(128, 128, 128, 1)");
  });

  it("infers a missing percentage as the complement", () => {
    // #fff at 97% + black (implicit 3%) → #f7f7f7.
    expect(
      canonicalColor(parseColorMix("color-mix(in srgb, #ffffff 97%, black)")!),
    ).toBe("rgba(247, 247, 247, 1)");
  });

  it("scales alpha when percentages sum below 100 / handles transparent", () => {
    expect(canonicalColor(parseColorMix("color-mix(in srgb, #0061d5 8%, transparent)")!)).toBe(
      "rgba(0, 97, 213, 0.08)",
    );
  });

  it("parses operands that themselves contain commas", () => {
    expect(
      canonicalColor(parseColorMix("color-mix(in srgb, rgb(0,97,213) 50%, #fff)")!),
    ).toBe("rgba(128, 176, 234, 1)");
  });

  it("returns null for unsupported spaces or unresolved operands", () => {
    expect(parseColorMix("color-mix(in oklch, #000, #fff)")).toBeNull();
    expect(parseColorMix("color-mix(in srgb, var(--x), #fff)")).toBeNull();
    expect(parseColorMix("#fff")).toBeNull();
  });
});

describe("splitTopLevel", () => {
  it("keeps commas inside parentheses intact", () => {
    expect(
      splitTopLevel("inset 0 0 0 1px rgba(0,0,0,.8), 0 1px 2px rgba(0,0,0,.1)"),
    ).toEqual(["inset 0 0 0 1px rgba(0,0,0,.8)", " 0 1px 2px rgba(0,0,0,.1)"]);
  });
});

describe("normalizeShadow", () => {
  it("normalises none/empty", () => {
    expect(normalizeShadow("none")).toBe("none");
    expect(normalizeShadow("  ")).toBe("none");
  });

  it("makes equivalent shadows compare equal across colour syntaxes", () => {
    const modern =
      "inset 0 0 0 1px rgb(255 255 255 / 80%), 0 1px 2px rgb(0 0 0 / 10%)";
    const legacy = "inset 0 0 0 1px rgba(255,255,255,.8),0 1px 2px rgba(0,0,0,.1)";
    expect(normalizeShadow(modern)).toBe(normalizeShadow(legacy));
  });

  it("distinguishes genuinely different shadows", () => {
    expect(normalizeShadow("0 1px 2px rgba(0,0,0,.1)")).not.toBe(
      normalizeShadow("0 2px 6px rgba(0,0,0,.1)"),
    );
  });
});

describe("resolveCssVars", () => {
  it("resolves a token from the map", () => {
    const map = new Map([["boe-token-stroke-stroke-hover", "#bcbcbc"]]);
    expect(resolveCssVars("var(--boe-token-stroke-stroke-hover, #999)", map)).toBe(
      "#bcbcbc",
    );
  });

  it("falls back to the inline default when the token is unknown", () => {
    expect(resolveCssVars("var(--boe-token-unknown, #0057c0)", new Map())).toBe(
      "#0057c0",
    );
  });

  it("passes plain values through untouched", () => {
    expect(resolveCssVars("#0061d5", new Map())).toBe("#0061d5");
  });
});

describe("compareColor", () => {
  it("marks exact colour matches conformant", () => {
    expect(
      compareColor({ boeValue: "#fff", upstreamValue: "#ffffff", kind: "color" })
        .verdict,
    ).toBe("conformant");
  });

  it("routes colour differences to review (not drift) with a delta", () => {
    const r = compareColor({
      boeValue: "#0057c0",
      upstreamValue: "#0074fe",
      kind: "color",
    });
    expect(r.verdict).toBe("review");
    expect(r.delta).toBe(62);
  });

  it("honours a per-channel tolerance", () => {
    expect(
      compareColor({
        boeValue: "#004eaa",
        upstreamValue: "#004eac",
        kind: "color",
        tolerance: 4,
      }).verdict,
    ).toBe("conformant");
  });

  it("matches equivalent shadows and flags different ones", () => {
    expect(
      compareColor({
        boeValue: "inset 0 0 0 1px rgb(255 255 255 / 80%), 0 1px 2px rgb(0 0 0 / 10%)",
        upstreamValue: "inset 0 0 0 1px rgba(255,255,255,.8),0 1px 2px rgba(0,0,0,.1)",
        kind: "shadow",
      }).verdict,
    ).toBe("conformant");
    expect(
      compareColor({
        boeValue: "0 1px 2px rgba(0,0,0,.1)",
        upstreamValue: "none",
        kind: "shadow",
      }).verdict,
    ).toBe("review");
  });

  it("flags missing sides distinctly", () => {
    expect(
      compareColor({ boeValue: null, upstreamValue: "#fff", kind: "color" }).verdict,
    ).toBe("missing-boe");
    expect(
      compareColor({ boeValue: "#fff", upstreamValue: null, kind: "color" }).verdict,
    ).toBe("missing-upstream");
  });

  it("resolves a color-mix and compares it (conformant when it matches)", () => {
    // #fff 92% + black 8% → #ebebeb, which is exactly upstream's active grey.
    expect(
      compareColor({
        boeValue: "color-mix(in srgb, #fff 92%, black 8%)",
        upstreamValue: "#ebebeb",
        kind: "color",
      }).verdict,
    ).toBe("conformant");
  });

  it("reviews a color-mix it cannot resolve (unsupported space / gradient)", () => {
    expect(
      compareColor({
        boeValue: "color-mix(in oklch, #fff, #000)",
        upstreamValue: "#f7f7f7",
        kind: "color",
      }).verdict,
    ).toBe("review");
  });
});

// ---------------------------------------------------------------------------
// css-extract
// ---------------------------------------------------------------------------

describe("extractBundleCss", () => {
  it("decodes a single css-loader string literal with escapes", () => {
    const js =
      "x=(___CSS_LOADER_EXPORT___.push([module.id,'.btn{color:#fff}\\n.a{b:1}',\"\"]));";
    expect(extractBundleCss(js)).toBe(".btn{color:#fff}\n.a{b:1}");
  });

  it("concatenates multiple pushes and handles double quotes", () => {
    const js =
      '___CSS_LOADER_EXPORT___.push([module.id,".a{x:1}",""]);' +
      "___CSS_LOADER_EXPORT___.push([module.id,'.b{y:2}','']);";
    expect(extractBundleCss(js)).toBe(".a{x:1}\n.b{y:2}");
  });

  it("returns empty string for a bundle with no CSS", () => {
    expect(extractBundleCss("console.log('no css here')")).toBe("");
  });
});

describe("stripCssComments", () => {
  it("removes block comments but keeps quoted / url content", () => {
    expect(stripCssComments("/* a */.x{color:red}")).toBe(".x{color:red}");
    expect(stripCssComments('.x{content:"/* not a comment */"}')).toBe(
      '.x{content:"/* not a comment */"}',
    );
    expect(stripCssComments(".x{background:url(http://a/b.png)}")).toBe(
      ".x{background:url(http://a/b.png)}",
    );
  });
});

describe("parseChunkNames", () => {
  it("recovers id.hash names from the webpack chunk map", () => {
    const runtime =
      'foo=e=>(e+"."+{398:"86aafe12",903:"f1d6cb68",1228:"332b6076"}[e]+".iframe.bundle.js");';
    expect(parseChunkNames(runtime)).toEqual([
      "398.86aafe12.iframe.bundle.js",
      "903.f1d6cb68.iframe.bundle.js",
      "1228.332b6076.iframe.bundle.js",
    ]);
  });

  it("returns [] when there is no chunk map", () => {
    expect(parseChunkNames("no chunks here")).toEqual([]);
  });
});

describe("partMatches", () => {
  it("matches the base subject and rejects longer names", () => {
    expect(partMatches(".btn", ".btn", "base")).toBe(true);
    expect(partMatches(".btn-primary", ".btn", "base")).toBe(false);
  });

  it("ignores :not() guards and matches the real state", () => {
    expect(
      partMatches(".btn-primary:not(.is-disabled):hover", ".btn-primary", "hover"),
    ).toBe(true);
    expect(
      partMatches(".btn-primary:not(.is-disabled):hover", ".btn-primary", "base"),
    ).toBe(false);
  });

  it("treats :focus and :focus-visible as focus", () => {
    expect(partMatches("button:focus-visible", "button", "focus")).toBe(true);
    expect(partMatches(".btn:focus", ".btn", "focus")).toBe(true);
  });

  it("keeps attribute variants distinct", () => {
    expect(partMatches('button[data-tone="neutral"]', "button", "base")).toBe(false);
    expect(
      partMatches('button[data-tone="neutral"]', 'button[data-tone="neutral"]', "base"),
    ).toBe(true);
  });

  it("rejects descendant / combinator rules", () => {
    expect(partMatches(".btn .icon", ".btn", "base")).toBe(false);
    expect(partMatches(".btn > span", ".btn", "base")).toBe(false);
  });
});

const FIXTURE_CSS = [
  ".btn{color:#4e4e4e;background-color:#fff;border-color:#bcbcbc}",
  ".btn:not(.is-disabled):hover{background-color:#f7f7f7}",
  ".btn:not(.is-disabled):active{background-color:#ebebeb;border-color:#bcbcbc}",
  ".btn:not(.is-disabled):focus{border-color:#222;box-shadow:0 1px 2px rgba(0,0,0,.1)}",
  ".btn-primary{color:#fff;background-color:#0061d5;border-color:#0061d5}",
  ".btn-primary:not(.is-disabled):hover,.btn-primary:not(.bdl-is-disabled):hover{background-color:#0074fe;border-color:#0074fe}",
  ".btn-primary:not(.is-disabled):active{background-color:#004eac;border-color:#004eac;box-shadow:none}",
  ".btn-primary:not(.is-disabled):focus{background-color:#0074fe;border:1px solid #0061d5;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 1px 2px rgba(0,0,0,.1)}",
  // Round 2: menu-item + badge (each is the first rule after a comment banner,
  // exercising the comment-strip that keeps the marker out of the selector).
  "/* 1319.hash.iframe.bundle.js */",
  ".menu-item{color:#222;background:transparent;min-height:30px}",
  ".menu-item:not(.is-disabled):hover{background-color:#f4f4f4;color:#222}",
  "/* 1228.hash.iframe.bundle.js */",
  ".badge{color:#222;background:#e8e8e8;border-radius:4px}",
  ".badge-success{background:#26c281;color:#fff}",
  ".badge-error{background:#ed3757}",
  ".badge-warning{background:#f5b31b}",
  ".badge-info{background:#7fb0ea}",
  // Round-4 broadening: menu selected, checkbox/radio marks (compound selectors),
  // tooltip.
  ".menu-item.is-active{background-color:rgba(34,34,34,.05)}",
  ".checkbox-label>input[type=checkbox]+span::after{border-right:2px solid #0061d5;border-bottom:2px solid #0061d5}",
  ".radio-label>input[type=radio]:checked+span::before{background-color:#0061d5;border:3px solid #fff}",
  ".bdl-Tooltip{background-color:#4e4e4e;color:#fff;border-radius:4px}",
].join("\n");

describe("extractCompiledDeclarations", () => {
  it("reads a base declaration", () => {
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".btn-primary", "base", "background-color"),
    ).toEqual(["#0061d5"]);
  });

  it("reads state declarations without cross-state bleed", () => {
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".btn-primary", "hover", "background-color"),
    ).toEqual(["#0074fe"]);
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".btn-primary", "active", "background-color"),
    ).toEqual(["#004eac"]);
  });

  it("does not confuse .btn with .btn-primary", () => {
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".btn", "base", "background-color"),
    ).toEqual(["#fff"]);
  });

  it("reads a rule that immediately follows a comment banner", () => {
    // .badge is the first rule after a `/* … */` marker — the comment must not
    // leak into its selector.
    expect(extractCompiledDeclarations(FIXTURE_CSS, ".badge", "base", "color")).toEqual([
      "#222",
    ]);
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".badge", "base", "background"),
    ).toEqual(["#e8e8e8"]);
  });

  it("returns [] when nothing matches", () => {
    expect(
      extractCompiledDeclarations(FIXTURE_CSS, ".nonexistent", "hover", "background-color"),
    ).toEqual([]);
  });
});

describe("extractRawDeclarations", () => {
  it("matches a verbatim compound selector partMatches would reject", () => {
    expect(
      extractRawDeclarations(
        FIXTURE_CSS,
        ".radio-label>input[type=radio]:checked+span::before",
        "background-color",
      ),
    ).toEqual(["#0061d5"]);
    expect(
      extractRawDeclarations(
        FIXTURE_CSS,
        ".checkbox-label>input[type=checkbox]+span::after",
        "border-right",
      ),
    ).toEqual(["2px solid #0061d5"]);
  });

  it("requires an exact part match (no prefix bleed)", () => {
    expect(extractRawDeclarations(FIXTURE_CSS, ".radio-label", "color")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// color-manifest
// ---------------------------------------------------------------------------

describe("tokenToVarName + buildTokenMap", () => {
  it("kebab-cases token keys like the registry does", () => {
    expect(tokenToVarName("SurfaceSurfaceBrandHover")).toBe("surface-surface-brand-hover");
    expect(tokenToVarName("TextTextOnBrand")).toBe("text-text-on-brand");
  });

  it("keys the token map by CSS custom-property name", () => {
    expect(buildTokenMap().get("boe-token-surface-surface-brand")).toBe("#0061d5");
  });
});

// ---------------------------------------------------------------------------
// color-audit
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  it("parses flags", () => {
    expect(parseArgs(["--refresh", "--strict"])).toEqual({
      refresh: true,
      offline: false,
      strict: true,
    });
    expect(parseArgs([])).toEqual({ refresh: false, offline: false, strict: false });
  });
});

describe("parseBundleNames", () => {
  it("extracts validated iframe bundle names and dedupes", () => {
    const html =
      "import './runtime~main.011b673e.iframe.bundle.js';\n" +
      "import './main.2ccbd4b8.iframe.bundle.js';\n" +
      "import './main.2ccbd4b8.iframe.bundle.js';\n" +
      "import 'https://evil.example/x.iframe.bundle.js';";
    expect(parseBundleNames(html)).toEqual([
      "runtime~main.011b673e.iframe.bundle.js",
      "main.2ccbd4b8.iframe.bundle.js",
    ]);
  });
});

const readSrc = (rel: string): string => readFileSync(join(process.cwd(), rel), "utf8");
const COMPONENT_SOURCE = new Map<string, string | null>(
  [
    "src/components/actions/button.ts",
    "src/components/actions/menu-item.ts",
    "src/components/feedback/badge.ts",
    "src/components/forms/checkbox.ts",
    "src/components/forms/radio-group.ts",
    "src/components/overlays/tooltip.ts",
  ].map(rel => [rel, readSrc(rel)]),
);

describe("anchorPresent", () => {
  it("is true when the component still declares the anchor", () => {
    const claim = COLOR_CLAIMS.find(c => c.id === "button.primary.background")!;
    expect(anchorPresent(claim, COMPONENT_SOURCE)).toBe(true);
  });

  it("is false when the source is missing or the anchor moved", () => {
    const claim = COLOR_CLAIMS[0];
    expect(anchorPresent(claim, new Map([[claim.boeComponent, null]]))).toBe(false);
    expect(
      anchorPresent(claim, new Map([[claim.boeComponent, "/* nothing */"]])),
    ).toBe(false);
  });

  it("every shipped manifest anchor is grounded in the real component", () => {
    for (const claim of COLOR_CLAIMS) {
      expect(anchorPresent(claim, COMPONENT_SOURCE), claim.id).toBe(true);
    }
  });
});

describe("evaluate", () => {
  const rows = evaluate(FIXTURE_CSS, COMPONENT_SOURCE);

  it("resolves every claim against the compiled CSS", () => {
    expect(rows).toHaveLength(COLOR_CLAIMS.length);
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("button.primary.background").verdict).toBe("conformant");
    expect(byId("button.primary.focus.shadow").verdict).toBe("conformant");
    expect(byId("button.neutral.focus.shadow").verdict).toBe("conformant");
    expect(byId("button.primary.hover.background").verdict).toBe("review");
    // box-open-elements hover is now #006ae9 (matches the real Box app); the
    // Storybook fixture is the legacy #0074fe, so the delta is 21.
    expect(byId("button.primary.hover.background").delta).toBe(21);
  });

  it("yields the expected verdict mix (20 conformant, 6 review)", () => {
    const conformant = rows.filter(r => r.verdict === "conformant").length;
    const review = rows.filter(r => r.verdict === "review").length;
    expect({ conformant, review }).toEqual({ conformant: 20, review: 6 });
  });

  it("resolves the round-2 surfaces (menu + badge)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("menu.item.hover.background").verdict).toBe("conformant");
    expect(byId("badge.success.background").verdict).toBe("conformant");
    expect(byId("badge.neutral.background").verdict).toBe("review");
  });

  it("resolves the round-3 color-mix surfaces against upstream", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("button.neutral.hover.background").boeCanonical).toBe("rgba(247, 247, 247, 1)");
    expect(byId("button.neutral.hover.background").verdict).toBe("conformant");
    expect(byId("button.neutral.active.background").verdict).toBe("conformant");
    expect(byId("badge.info.background").verdict).toBe("conformant"); // ±1 rounding
  });

  it("flags a stale anchor as missing-boe", () => {
    const stale = evaluate(FIXTURE_CSS, new Map([["src/components/actions/button.ts", "/* gutted */"]]));
    expect(stale.every(r => r.verdict === "missing-boe")).toBe(true);
  });

  it("flags an absent upstream rule as missing-upstream", () => {
    const rowsNoCss = evaluate("", COMPONENT_SOURCE);
    expect(rowsNoCss.every(r => r.verdict === "missing-upstream")).toBe(true);
  });
});

describe("computeExitCode", () => {
  const mk = (verdict: Row["verdict"]): Row =>
    ({ verdict } as Row);
  it("is 0 unless strict", () => {
    expect(computeExitCode([mk("review")], false)).toBe(0);
  });
  it("is 1 in strict mode when any claim is not conformant", () => {
    expect(computeExitCode([mk("conformant"), mk("review")], true)).toBe(1);
    expect(computeExitCode([mk("conformant")], true)).toBe(0);
  });
});

describe("renderMarkdown", () => {
  it("renders a summary, the bundle list, and every claim row", () => {
    const rows = evaluate(FIXTURE_CSS, COMPONENT_SOURCE);
    const md = renderMarkdown(rows, ["main.abc.iframe.bundle.js"]);
    expect(md).toContain("Layer 2");
    expect(md).toContain("**1**");
    expect(md).toContain("| ✅ Conformant | 20 |");
    expect(md).toContain("| 🔍 Review | 6 |");
    for (const claim of COLOR_CLAIMS) {
      expect(md).toContain(claim.citation);
    }
  });
});
