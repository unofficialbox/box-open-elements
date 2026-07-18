import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  computeExitCode,
  evaluate,
  evaluateGeometry,
  evaluateStates,
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

describe("evaluateStates", () => {
  const baseState = (over: Record<string, unknown> = {}): Reference => ({
    capturedFrom: "x",
    capturedOn: "x",
    tokens: {},
    observations: {
      states: {
        surfaces: [
          {
            surface: "primary button",
            state: "hover",
            blueprintVar: "--surface-surface-brand-hover",
            rendered: "#006ae9",
            boeToken: "SurfaceSurfaceBrandHover",
          },
          ...(over.extra ? (over.extra as object[]) : []),
        ],
      },
    },
  });

  it("marks a token that matches the in-situ rendered state conformant", () => {
    const rows = evaluateStates({ SurfaceSurfaceBrandHover: "#006ae9" }, baseState());
    expect(rows[0].verdict).toBe("conformant");
    expect(rows[0].delta).toBe(0);
  });

  it("routes an unmarked state mismatch to review, an `accepted` one to accepted-divergence", () => {
    const ref = baseState({
      extra: [
        {
          surface: "file-list row",
          state: "hover",
          blueprintVar: "--surface-surface-hover",
          rendered: "#f4f4f4",
          boeToken: "SurfaceItemSurfaceHover",
        },
      ],
    });
    // box-open-elements' item-hover blue tint vs Box's neutral #f4f4f4, unmarked → review.
    expect(
      evaluateStates({ SurfaceSurfaceBrandHover: "#006ae9", SurfaceItemSurfaceHover: "#eaf2fd" }, ref)
        .find(r => r.surface === "file-list row")!.verdict,
    ).toBe("review");
    // Mark it accepted → accepted-divergence, which passes --strict.
    ref.observations!.states!.surfaces[1].accepted = "intentional blue tint";
    const rows = evaluateStates(
      { SurfaceSurfaceBrandHover: "#006ae9", SurfaceItemSurfaceHover: "#eaf2fd" },
      ref,
    );
    expect(rows.find(r => r.surface === "file-list row")!.verdict).toBe("accepted-divergence");
    expect(computeExitCode(rows, true)).toBe(0);
  });

  it("flags a state token the catalog lacks as missing-boe", () => {
    const rows = evaluateStates({}, baseState());
    expect(rows[0].verdict).toBe("missing-boe");
    expect(rows[0].boeValue).toBeNull();
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
    // 24/25 tokens match the real Box app; the sole divergence is
    // SurfaceItemSurfaceHover (box-open-elements' intentional blue hover tint vs
    // Box #fff), marked `accepted` in the reference — so no `review` remains.
    expect(rows).toHaveLength(25);
    expect(conformant).toBe(24);
    expect(rows.filter(r => r.verdict === "review")).toHaveLength(0);
    expect(rows.find(r => r.token === "SurfaceItemSurfaceHover")!.verdict).toBe(
      "accepted-divergence",
    );
    expect(rows.find(r => r.token === "SurfaceSurfaceBrandHover")!.verdict).toBe("conformant");
    expect(rows.find(r => r.token === "SurfaceTooltipSurface")!.verdict).toBe("conformant");
    // In-situ interaction states: button hover/active + menu hover are conformant;
    // the file-row hover is the accepted blue-tint divergence — no `review`.
    const states = evaluateStates(
      boxDefaultDesignSystem.tokens as Record<string, unknown>,
      reference,
    );
    expect(states.length).toBeGreaterThanOrEqual(4);
    expect(states.filter(s => s.verdict === "review")).toHaveLength(0);
    expect(states.find(s => s.surface === "file-list row")!.verdict).toBe("accepted-divergence");
    expect(
      states.find(s => s.surface === "primary button" && s.state === "hover")!.verdict,
    ).toBe("conformant");
    // With only conformant + accepted-divergence, the audit passes --strict.
    expect(computeExitCode([...rows, ...evaluateGeometry(reference), ...states], true)).toBe(0);
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
