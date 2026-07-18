import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  computeExitCode,
  evaluate,
  renderMarkdown,
  type Reference,
  type Row,
} from "../../tools/bue-conformance/webapp-audit.js";
import { boxDefaultDesignSystem } from "../../src/foundations/tokens/box-defaults.js";

const REF: Reference = {
  capturedFrom: "app.box.com",
  capturedOn: "2026-07-18",
  tokens: {
    SurfaceSurfaceBrand: { blueprintVar: "--surface-surface-brand", value: "#0061d5" },
    TextText: { blueprintVar: "--text-text-on-light", value: "#222" },
    TextTextDanger: { blueprintVar: "--text-text-destructive-on-light", value: "#d5324e" },
    NotInCatalog: { blueprintVar: "--x", value: "#123456" },
  },
};

const BOE = {
  SurfaceSurfaceBrand: "#0061d5",
  TextText: "#222222",
  TextTextDanger: "#c4183c",
};

describe("evaluate", () => {
  const rows = evaluate(BOE, REF);
  const byId = (t: string): Row => rows.find(r => r.token === t)!;

  it("marks exact colour matches conformant (hex length-agnostic)", () => {
    expect(byId("SurfaceSurfaceBrand").verdict).toBe("conformant");
    expect(byId("TextText").verdict).toBe("conformant"); // #222 == #222222
  });

  it("flags divergence from the real app as review with a delta", () => {
    const r = byId("TextTextDanger");
    expect(r.verdict).toBe("review");
    expect(r.delta).toBe(26);
  });

  it("flags a token the catalog lacks as missing-boe", () => {
    expect(byId("NotInCatalog").verdict).toBe("missing-boe");
    expect(byId("NotInCatalog").boeValue).toBeNull();
  });
});

describe("computeExitCode", () => {
  const mk = (v: Row["verdict"]): Row => ({ verdict: v } as Row);
  it("is 0 unless strict", () => {
    expect(computeExitCode([mk("review")], false)).toBe(0);
  });
  it("is 1 in strict mode unless every token is conformant", () => {
    expect(computeExitCode([mk("conformant"), mk("review")], true)).toBe(1);
    expect(computeExitCode([mk("conformant")], true)).toBe(0);
  });
});

describe("renderMarkdown", () => {
  it("renders the summary, capture provenance, and every token row", () => {
    const md = renderMarkdown(evaluate(BOE, REF), REF);
    expect(md).toContain("Real Box Web App");
    expect(md).toContain("2026-07-18");
    for (const t of Object.keys(REF.tokens)) expect(md).toContain("`" + t + "`");
  });
});

describe("box-open-elements vs the committed live-Box reference", () => {
  it("stays conformant on the surfaces box-open-elements is faithful to", () => {
    const reference = JSON.parse(
      readFileSync(join(process.cwd(), "docs/audits/box-webapp-reference.data.json"), "utf8"),
    ) as Reference;
    const rows = evaluate(
      boxDefaultDesignSystem.tokens as Record<string, unknown>,
      reference,
    );
    const conformant = rows.filter(r => r.verdict === "conformant").length;
    // 17/20 tokens match the real Box app (brand-hover + tooltip fixed to match);
    // the 3 reviews are brand-pressed (Δ2), item-surface-hover, and text-danger.
    expect(rows).toHaveLength(20);
    expect(conformant).toBe(17);
    // the two corrected tokens now match the live app exactly
    expect(rows.find(r => r.token === "SurfaceSurfaceBrandHover")!.verdict).toBe("conformant");
    expect(rows.find(r => r.token === "SurfaceTooltipSurface")!.verdict).toBe("conformant");
  });
});
