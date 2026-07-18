import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  computeExitCode,
  evaluate,
  evaluateGeometry,
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

describe("evaluateGeometry", () => {
  it("verifies pill radii against the live-Box geometry observations", () => {
    const reference = JSON.parse(
      readFileSync(join(process.cwd(), "docs/audits/box-webapp-reference.data.json"), "utf8"),
    ) as Reference;
    const rows = evaluateGeometry(reference);
    // box-open-elements' control + overlay radii must match the captured live-Box
    // radii — this is what confirms the Layer 1 "intentional-divergence" claims.
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.every(r => r.verdict === "conformant")).toBe(true);
    expect(rows.find(r => r.surface.includes("button"))?.boxValue).toBe("20px");
    expect(rows.find(r => r.surface.includes("dialog"))?.boxValue).toBe("24px");
    expect(rows.find(r => r.surface.includes("menu item"))?.boxValue).toBe("12px");
  });

  it("flags a radius that stopped matching the live app as review", () => {
    const ref: Reference = {
      capturedFrom: "x",
      capturedOn: "x",
      tokens: {},
      observations: { geometry: { primaryButton: { borderRadius: "99px" } } },
    };
    const button = evaluateGeometry(ref).find(r => r.surface.includes("button"));
    expect(button?.verdict).toBe("review"); // box-open-elements 20px vs 99px
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
    // 19/20 tokens match the real Box app; the sole divergence is
    // SurfaceItemSurfaceHover (box-open-elements' intentional blue hover tint vs
    // Box #fff), marked `accepted` in the reference — so no `review` remains.
    expect(rows).toHaveLength(20);
    expect(conformant).toBe(19);
    expect(rows.filter(r => r.verdict === "review")).toHaveLength(0);
    expect(rows.find(r => r.token === "SurfaceItemSurfaceHover")!.verdict).toBe(
      "accepted-divergence",
    );
    expect(rows.find(r => r.token === "SurfaceSurfaceBrandHover")!.verdict).toBe("conformant");
    expect(rows.find(r => r.token === "SurfaceTooltipSurface")!.verdict).toBe("conformant");
    // With only conformant + accepted-divergence, the audit passes --strict.
    expect(computeExitCode([...rows, ...evaluateGeometry(reference)], true)).toBe(0);
  });

  it("routes an unmarked mismatch to review, but an `accepted` one to accepted-divergence", () => {
    const base = {
      capturedFrom: "x",
      capturedOn: "x",
      tokens: {
        A: { blueprintVar: "--a", value: "#000000" },
      },
    } as Reference;
    expect(evaluate({ A: "#111111" }, base)[0].verdict).toBe("review");
    base.tokens.A.accepted = "intentional";
    expect(evaluate({ A: "#111111" }, base)[0].verdict).toBe("accepted-divergence");
    expect(computeExitCode(evaluate({ A: "#111111" }, base), true)).toBe(0);
  });
});
