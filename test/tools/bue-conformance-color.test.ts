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
  conformantFloorExitCode,
  crossReferenceWebapp,
  evaluate,
  loadWebappTokens,
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
  // Round-5 broadening: avatar, pill-cloud, tag-input, spinner, form label, text inputs.
  '.avatar .avatar-initials[data-bg-idx="0"]{background-color:#0061d5}',
  ".avatar .avatar-initials{display:flex;color:#fff;font-weight:bold}",
  ".bdl-Pill.bdl-PillCloud-button{display:inline-block;margin:3px;color:#0061d5;background-color:#fff;border:1px solid #0061d5}",
  ".bdl-PillSelectorDropdown .bdl-PillSelector.is-focused{border-color:#0061d5;outline:0;box-shadow:none}",
  ".crawler div{display:inline-block;width:2px;height:10px;background-color:#0061d5;border-radius:4px}",
  ".bdl-Label,.label{display:block;color:#6f6f6f;font-weight:bold}",
  "input[type=text],input[type=date],div[contentEditable=true],textarea{width:262px;padding:7px;color:#222;border:1px solid #d3d3d3}",
  "input[type=text]:focus,textarea:focus{border:1px solid #0061d5;outline:0}",
  // Round-6 broadening: switch, date-field/calendar, dropdown/menu surface.
  ".toggle-simple-switch::before{right:0;background-color:#bcbcbc;border-radius:20px}",
  ".toggle-simple-input:checked~.toggle-simple-switch::before{background-color:#0061d5}",
  ".toggle-simple-switch::after{width:20px;height:20px;background-color:#fff;border:1px solid #6f6f6f}",
  ".date-picker-wrapper .date-picker-description{color:#6f6f6f}",
  ".is-selected .pika-button{color:#fff;font-weight:bold;background-color:#0061d5;border-radius:6px}",
  ".dropdown-menu-element{color:#222}",
  ".aria-menu{background-color:#fff;border:1px solid #e8e8e8}",
  // Round-7 broadening: select (descendant rawSelectors), dialog/modal, toast
  // (upstream Notification), progress-bar (ContentUploader progress fill).
  ".select-container select,.bcp .select-container select{padding-right:25px;color:#222;background:none;border:none}",
  ".select-container .select-overlay,.bcp .select-container .select-overlay{background-color:#fff;border:1px solid #d3d3d3;border-radius:6px}",
  ".select-container .bdl-SelectButton:focus,.bcp .select-container .select-button:focus{border:1px solid #0061d5}",
  ".modal-dialog{position:relative;width:460px;padding:30px;background-color:#fff;border-radius:12px;box-shadow:0 1px 1px 1px rgba(0,0,0,.05)}",
  ".modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.75)}",
  ".notification{color:#222;font-weight:bold;background-color:#e8e8e8;border:2px solid #222;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.15)}",
  ".notification.info{background-color:#d4f3e6;border-color:#26c281}",
  ".notification.warn{background-color:#fdf0d1;border-color:#f5b31b}",
  ".notification.error{background-color:#fbd7dd;border-color:#ed3757}",
  ".bcu-progress-container .bcu-progress{top:0;left:0;height:2px;background:#0061d5;box-shadow:0 1px 5px 0 #e4f4ff}",
  // Round-8 broadening: alert (upstream InlineNotice), breadcrumb, chip.
  ".inline-alert{display:none;margin:10px 0;padding:14px 10px;color:#222;border-radius:6px}",
  ".inline-alert.inline-alert-generic{background-color:#e8e8e8;border:1px solid #909090}",
  ".inline-alert.inline-alert-success{background-color:#e9f8f2;border:1px solid #26c281}",
  ".inline-alert.inline-alert-error{background-color:#fdebee;border:1px solid #f69bab}",
  ".inline-alert.inline-alert-warning{background-color:#fef7e8;border:1px solid #fad98d}",
  ".breadcrumbs .breadcrumb-item *{overflow:hidden;color:#909090;white-space:nowrap}",
  ".breadcrumbs .breadcrumb-item.breadcrumb-item-last *{color:#4e4e4e}",
  ".bdl-LabelPill{color:#222;font-weight:bold}",
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
      minConformant: null,
    });
    expect(parseArgs([])).toEqual({
      refresh: false,
      offline: false,
      strict: false,
      minConformant: null,
    });
  });

  it("parses the --min-conformant floor (and ignores a non-numeric value)", () => {
    expect(parseArgs(["--min-conformant=40"]).minConformant).toBe(40);
    expect(parseArgs(["--offline", "--min-conformant=0"]).minConformant).toBe(0);
    expect(parseArgs(["--min-conformant=abc"]).minConformant).toBeNull();
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
// Derived from the manifest so new claim families are covered automatically —
// the "every anchor grounded" test then guards every shipped component.
const COMPONENT_SOURCE = new Map<string, string | null>(
  [...new Set(COLOR_CLAIMS.map(c => c.boeComponent))].map(rel => [rel, readSrc(rel)]),
);
// The real committed live-Box capture — same source production reads — so the
// `evaluate` tests below exercise the full cross-reference behaviour end to end.
const WEBAPP_TOKENS = loadWebappTokens();

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
  const rows = evaluate(FIXTURE_CSS, COMPONENT_SOURCE, WEBAPP_TOKENS);

  it("resolves every claim against the compiled CSS", () => {
    expect(rows).toHaveLength(COLOR_CLAIMS.length);
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("button.primary.background").verdict).toBe("conformant");
    expect(byId("button.primary.focus.shadow").verdict).toBe("conformant");
    expect(byId("button.neutral.focus.shadow").verdict).toBe("conformant");
    // box-open-elements hover is now #006ae9 (matches the real Box app, per
    // box-webapp-reference.data.json); the Storybook fixture is the legacy
    // #0074fe, so it cross-references to accepted-divergence, not review.
    expect(byId("button.primary.hover.background").verdict).toBe("accepted-divergence");
    expect(byId("button.primary.hover.background").delta).toBe(21);
  });

  it("yields the expected verdict mix (63 conformant, 9 accepted-divergence, 0 review)", () => {
    const conformant = rows.filter(r => r.verdict === "conformant").length;
    const accepted = rows.filter(r => r.verdict === "accepted-divergence").length;
    const review = rows.filter(r => r.verdict === "review").length;
    expect({ conformant, accepted, review }).toEqual({
      conformant: 63,
      accepted: 9,
      review: 0,
    });
  });

  it("resolves the round-8 surfaces (alert, breadcrumb, chip)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("alert.text").verdict).toBe("conformant");
    // The tonal fills/borders are the same tint math upstream produces with
    // Sass: exact on error/warning, ±1 channel on the success fill.
    expect(byId("alert.success.background").verdict).toBe("conformant");
    expect(byId("alert.success.border").verdict).toBe("conformant");
    expect(byId("alert.error.background").verdict).toBe("conformant");
    expect(byId("alert.error.border").verdict).toBe("conformant");
    expect(byId("alert.warning.background").verdict).toBe("conformant");
    expect(byId("alert.warning.border").verdict).toBe("conformant");
    // Neutral fill/outline + both breadcrumb texts modernise legacy greys to
    // Blueprint tokens — vouched by the live-Box capture.
    expect(byId("alert.neutral.background").verdict).toBe("accepted-divergence");
    expect(byId("alert.neutral.border").verdict).toBe("accepted-divergence");
    expect(byId("breadcrumb.link.text").verdict).toBe("accepted-divergence");
    expect(byId("breadcrumb.current.text").verdict).toBe("accepted-divergence");
    expect(byId("chip.text").verdict).toBe("conformant");
  });

  it("resolves the round-7 surfaces (select, dialog, toast, progress-bar)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("select.text").verdict).toBe("conformant");
    expect(byId("select.control.background").verdict).toBe("conformant");
    expect(byId("select.control.border").verdict).toBe("conformant");
    expect(byId("select.control.focus.border").verdict).toBe("conformant");
    expect(byId("dialog.surface.background").verdict).toBe("conformant");
    expect(byId("dialog.backdrop").verdict).toBe("conformant");
    expect(byId("dialog.surface.shadow").verdict).toBe("conformant");
    expect(byId("toast.text").verdict).toBe("conformant");
    expect(byId("toast.border").verdict).toBe("conformant");
    // Same modernised secondary surface as badge: #fbfbfb in the live Box app
    // vs the legacy Storybook's #e8e8e8 — live-Box capture vouches for it.
    expect(byId("toast.neutral.background").verdict).toBe("accepted-divergence");
    expect(byId("toast.shadow").verdict).toBe("conformant");
    expect(byId("toast.success.border").verdict).toBe("conformant");
    expect(byId("toast.error.border").verdict).toBe("conformant");
    expect(byId("toast.warning.border").verdict).toBe("conformant");
    expect(byId("progress-bar.fill").verdict).toBe("conformant");
  });

  it("resolves the round-6 surfaces (switch, date/calendar, dropdown/menu)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("switch.track.off.background").verdict).toBe("conformant");
    expect(byId("switch.track.on.background").verdict).toBe("conformant");
    expect(byId("switch.thumb.background").verdict).toBe("conformant");
    expect(byId("date-field.description.text").verdict).toBe("conformant");
    expect(byId("calendar.day.selected.background").verdict).toBe("conformant");
    expect(byId("calendar.day.selected.text").verdict).toBe("conformant");
    expect(byId("dropdown.item.text").verdict).toBe("conformant");
    expect(byId("menu.surface.background").verdict).toBe("conformant");
    expect(byId("menu.surface.border").verdict).toBe("conformant");
  });

  it("resolves the round-5 surfaces (avatar, pill, spinner, label, inputs)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("avatar.background").verdict).toBe("conformant");
    expect(byId("avatar.initials.text").verdict).toBe("conformant");
    expect(byId("pillcloud.pill.background").verdict).toBe("conformant");
    expect(byId("pillcloud.pill.brand.border").verdict).toBe("conformant");
    expect(byId("taginput.control.focus.border").verdict).toBe("conformant");
    expect(byId("spinner.indicator.brand").verdict).toBe("conformant");
    expect(byId("label.text").verdict).toBe("conformant");
    expect(byId("text-field.input.text").verdict).toBe("conformant");
    expect(byId("text-area.textarea.text").verdict).toBe("conformant");
    expect(byId("text-area.textarea.focus.border").verdict).toBe("conformant");
  });

  it("resolves the round-2 surfaces (menu + badge)", () => {
    const byId = (id: string): Row => rows.find(r => r.claim.id === id)!;
    expect(byId("menu.item.hover.background").verdict).toBe("conformant");
    expect(byId("badge.success.background").verdict).toBe("conformant");
    // #fbfbfb matches the live Box app (SurfaceSurfaceSecondary); the Storybook
    // fixture's #e8e8e8 is legacy.
    expect(byId("badge.neutral.background").verdict).toBe("accepted-divergence");
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

  it("accepted-divergence passes strict mode (a confirmed, not unverified, difference)", () => {
    expect(computeExitCode([mk("conformant"), mk("accepted-divergence")], true)).toBe(0);
  });
});

describe("loadWebappTokens", () => {
  it("loads the committed live-Box reference as a token → hex map", () => {
    expect(WEBAPP_TOKENS.get("SurfaceSurfaceBrandHover")).toBe("#006ae9");
    expect(WEBAPP_TOKENS.get("TextTextSecondary")).toBe("#6f6f6f");
  });

  it("returns an empty map for a missing/unreadable file rather than throwing", () => {
    expect(loadWebappTokens("/nonexistent/box-webapp-reference.data.json").size).toBe(0);
  });
});

describe("crossReferenceWebapp", () => {
  const claim = COLOR_CLAIMS.find(c => c.id === "button.primary.hover.background")!;

  it("downgrades review to accepted-divergence when the live-Box capture confirms the value", () => {
    const result = crossReferenceWebapp(
      { claim, verdict: "review", boeCanonical: "rgba(0, 106, 233, 1)" },
      new Map([["SurfaceSurfaceBrandHover", "#006ae9"]]),
    );
    expect(result.verdict).toBe("accepted-divergence");
    expect(result.note).toContain("box-webapp-reference.data.json");
  });

  it("leaves review alone when the claim has no webappToken, or the map has no entry for it", () => {
    const noTokenClaim = COLOR_CLAIMS.find(c => c.id === "button.primary.background")!;
    expect(
      crossReferenceWebapp(
        { claim: noTokenClaim, verdict: "review", boeCanonical: "rgba(0, 0, 0, 1)" },
        new Map([["SurfaceSurfaceBrandHover", "#006ae9"]]),
      ).verdict,
    ).toBe("review");
    expect(
      crossReferenceWebapp(
        { claim, verdict: "review", boeCanonical: "rgba(0, 106, 233, 1)" },
        new Map(),
      ).verdict,
    ).toBe("review");
  });

  it("leaves review alone when the webapp capture doesn't confirm the value either", () => {
    expect(
      crossReferenceWebapp(
        { claim, verdict: "review", boeCanonical: "rgba(0, 106, 233, 1)" },
        new Map([["SurfaceSurfaceBrandHover", "#000000"]]),
      ).verdict,
    ).toBe("review");
  });

  it("passes non-review verdicts through unchanged", () => {
    expect(
      crossReferenceWebapp(
        { claim, verdict: "conformant", boeCanonical: "rgba(0, 106, 233, 1)" },
        new Map([["SurfaceSurfaceBrandHover", "#006ae9"]]),
      ).verdict,
    ).toBe("conformant");
  });
});

describe("conformantFloorExitCode", () => {
  const mk = (verdict: Row["verdict"]): Row => ({ verdict } as Row);
  const rows = [mk("conformant"), mk("conformant"), mk("review"), mk("conformant")]; // 3 conformant

  it("is a no-op when no floor is set", () => {
    expect(conformantFloorExitCode(rows, null)).toBe(0);
  });

  it("passes at or above the floor and fails below it — reviews don't count", () => {
    expect(conformantFloorExitCode(rows, 3)).toBe(0); // exactly at floor
    expect(conformantFloorExitCode(rows, 2)).toBe(0);
    expect(conformantFloorExitCode(rows, 4)).toBe(1); // a conformant claim would have to regress
  });
});

describe("renderMarkdown", () => {
  it("renders a summary, the bundle list, and every claim row", () => {
    const rows = evaluate(FIXTURE_CSS, COMPONENT_SOURCE, WEBAPP_TOKENS);
    const md = renderMarkdown(rows, ["main.abc.iframe.bundle.js"]);
    expect(md).toContain("Layer 2");
    expect(md).toContain("**1**");
    expect(md).toContain("| ✅ Conformant | 63 |");
    expect(md).toContain("| 🎯 Accepted divergence | 9 |");
    expect(md).toContain("| 🔍 Review | 0 |");
    for (const claim of COLOR_CLAIMS) {
      expect(md).toContain(claim.citation);
    }
  });

  it("surfaces the frozen-snapshot refresh cadence", () => {
    const md = renderMarkdown(evaluate(FIXTURE_CSS, COMPONENT_SOURCE, WEBAPP_TOKENS), []);
    expect(md).toContain("Keeping this current");
    expect(md).toContain("bue-conformance:color --refresh");
    expect(md).toContain("quarterly");
  });
});
