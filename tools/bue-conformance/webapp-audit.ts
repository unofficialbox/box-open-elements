/**
 * box-ui-elements conformance audit — **webapp layer** (real Box product).
 *
 * Diffs box-open-elements' shipped design tokens against the **live Box web app**
 * (`app.box.com`, Blueprint design system) — the conformance *ground truth*,
 * stronger than the box-ui-elements Storybook the other layers compare against.
 *
 * The Box side is a dated snapshot in `docs/audits/box-webapp-reference.data.json`,
 * captured by reading Blueprint's `:root` design tokens with `getComputedStyle`
 * from a browser signed in to the real app (see that file's `method`). Refresh it
 * by re-capturing from a logged-in session; this audit is deterministic given the
 * snapshot.
 *
 * Usage:
 *   bun tools/bue-conformance/webapp-audit.ts          # regenerate the report
 *   bun tools/bue-conformance/webapp-audit.ts --strict # exit 1 unless all conformant
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalColor, colorDelta, parseColor } from "./color-signals.js";
import { boxDefaultDesignSystem } from "../../src/foundations/tokens/box-defaults.js";
import { boeControl, boeOverlay, boeRadius } from "../../src/foundations/geometry/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const REFERENCE = join(REPO_ROOT, "docs/audits/box-webapp-reference.data.json");
const REPORT_MD = join(REPO_ROOT, "docs/audits/bue-conformance-webapp-audit.md");
const REPORT_JSON = join(REPO_ROOT, "docs/audits/bue-conformance-webapp-audit.data.json");

export type Verdict = "conformant" | "review" | "missing-boe";

export interface Reference {
  capturedFrom: string;
  capturedOn: string;
  tokens: Record<string, { blueprintVar: string; value: string }>;
  observations?: {
    geometry?: Record<string, { borderRadius?: string } | string>;
  };
}

export interface GeometryRow {
  surface: string;
  boeConst: string;
  boeValue: string;
  boxValue: string;
  verdict: Verdict;
}

/** Parse a pixel length (`"20px"` → 20); returns null for non-px. */
function px(value: string | undefined): number | null {
  if (!value) return null;
  const m = /^(-?\d*\.?\d+)px$/.exec(value.trim());
  return m ? Number.parseFloat(m[1]) : null;
}

/**
 * Verify box-open-elements' shipped **control geometry** against the live Box
 * app radii captured in `observations.geometry`. Without this, the radius claims
 * Layer 1 flags as `intentional-divergence` are only *asserted* to track Box —
 * this confirms box-open-elements' pill radii still match what the app renders.
 */
export function evaluateGeometry(reference: Reference): GeometryRow[] {
  const geo = reference.observations?.geometry ?? {};
  const radiusOf = (key: string): string | undefined => {
    const v = geo[key];
    return typeof v === "object" ? v.borderRadius : undefined;
  };
  const cmp = (surface: string, boeConst: string, boe: string, box: string | undefined): GeometryRow => {
    const b = px(box);
    const o = px(boe);
    return {
      surface,
      boeConst,
      boeValue: boe,
      boxValue: box ?? "—",
      verdict: box === undefined ? "missing-boe" : b !== null && o === b ? "conformant" : "review",
    };
  };
  return [
    cmp("button radius", "boeControl.radius", boeControl.radius, radiusOf("primaryButton")),
    cmp("search field radius", "boeRadius.field", boeRadius.field, radiusOf("searchInput")),
    cmp("nav item radius", "boeRadius.nav", boeRadius.nav, radiusOf("navItem")),
    cmp("dropdown menu radius", "boeOverlay.radius", boeOverlay.radius, radiusOf("dropdownMenu")),
    cmp("menu item radius", "boeOverlay.itemRadius", boeOverlay.itemRadius, radiusOf("dropdownMenuItem")),
    cmp("dialog radius", "boeOverlay.modalRadius", boeOverlay.modalRadius, radiusOf("dialog")),
  ];
}

export interface Row {
  token: string;
  blueprintVar: string;
  boeValue: string | null;
  boxValue: string;
  boeCanonical: string | null;
  boxCanonical: string | null;
  delta: number | null;
  verdict: Verdict;
}

/** Per-channel tolerance (0-255). 0 = exact; small values absorb rounding. */
export const TOLERANCE = 0;

/**
 * Compare each Box reference token against the value box-open-elements ships.
 * Both are colours; exact (within tolerance) → `conformant`, else `review`
 * (box-open-elements may diverge intentionally — the font family, for instance,
 * is deliberately Inter-first). `missing-boe` if the catalog lacks the token.
 */
export function evaluate(
  boeTokens: Record<string, unknown>,
  reference: Reference,
): Row[] {
  return Object.entries(reference.tokens).map(([token, ref]) => {
    const boeRaw = typeof boeTokens[token] === "string" ? (boeTokens[token] as string) : null;
    const boeColor = boeRaw ? parseColor(boeRaw) : null;
    const boxColor = parseColor(ref.value);
    if (!boeRaw) {
      return {
        token, blueprintVar: ref.blueprintVar, boeValue: null, boxValue: ref.value,
        boeCanonical: null, boxCanonical: boxColor ? canonicalColor(boxColor) : null,
        delta: null, verdict: "missing-boe" as Verdict,
      };
    }
    const delta = boeColor && boxColor ? colorDelta(boeColor, boxColor) : null;
    return {
      token,
      blueprintVar: ref.blueprintVar,
      boeValue: boeRaw,
      boxValue: ref.value,
      boeCanonical: boeColor ? canonicalColor(boeColor) : null,
      boxCanonical: boxColor ? canonicalColor(boxColor) : null,
      delta,
      verdict: delta !== null && delta <= TOLERANCE ? "conformant" : "review",
    };
  });
}

const ICON: Record<Verdict, string> = {
  conformant: "✅",
  review: "🔍",
  "missing-boe": "🚫",
};

export function computeExitCode(
  rows: readonly { verdict: Verdict }[],
  strict: boolean,
): number {
  if (!strict) return 0;
  return rows.every(r => r.verdict === "conformant") ? 0 : 1;
}

export function renderMarkdown(
  rows: Row[],
  reference: Reference,
  geometry: GeometryRow[] = [],
): string {
  const counts: Record<Verdict, number> = { conformant: 0, review: 0, "missing-boe": 0 };
  for (const r of rows) counts[r.verdict] += 1;
  const L: string[] = [];
  L.push("# box-ui-elements Conformance Audit — Real Box Web App (webapp layer)");
  L.push("");
  L.push(
    `Generated by \`bun run bue-conformance:webapp\`. Diffs box-open-elements' shipped ` +
      `design tokens (\`src/foundations/tokens/box-defaults\`) against the **live Box web ` +
      `app** — the conformance *ground truth*. Box side captured from \`${reference.capturedFrom}\` ` +
      `on **${reference.capturedOn}** by reading Blueprint's \`:root\` tokens with ` +
      "`getComputedStyle` (see `docs/audits/box-webapp-reference.data.json`).",
  );
  L.push("");
  L.push(
    "> **Reading the verdicts.** These compare against the *actual shipping Box product*, " +
      "so a `🔍 Review` is a concrete divergence from what Box renders today — most are " +
      "actionable. A few are intentional (e.g. box-open-elements keeps `InterVariable`-first " +
      "typography by maintainer decision; see the reference's `observations`).",
  );
  L.push("");
  L.push("## Summary");
  L.push("");
  L.push("| Verdict | Count |");
  L.push("| --- | ---: |");
  L.push(`| ✅ Conformant | ${counts.conformant} |`);
  L.push(`| 🔍 Review | ${counts.review} |`);
  L.push(`| 🚫 Missing box-open-elements | ${counts["missing-boe"]} |`);
  L.push(`| **Total tokens** | **${rows.length}** |`);
  L.push("");
  L.push("## Tokens");
  L.push("");
  L.push("| | Token | box-open-elements | Real Box (Blueprint) | Δ | Blueprint var |");
  L.push("| --- | --- | --- | --- | ---: | --- |");
  for (const r of rows) {
    L.push(
      `| ${ICON[r.verdict]} | \`${r.token}\` | ${r.boeCanonical ?? r.boeValue ?? "—"} | ` +
        `${r.boxCanonical ?? r.boxValue} | ${r.delta ?? "—"} | \`${r.blueprintVar}\` |`,
    );
  }
  L.push("");
  L.push("## Legend");
  L.push("");
  L.push("- ✅ **Conformant** — box-open-elements matches the live Box token within tolerance.");
  L.push("- 🔍 **Review** — differs from what Box ships today (delta = max per-channel difference, 0-255).");
  L.push("- 🚫 **Missing box-open-elements** — the catalog has no matching token.");
  L.push("");
  if (geometry.length > 0) {
    L.push("## Control geometry");
    L.push("");
    L.push(
      "Verifies box-open-elements' pill radii against the live Box app — these are the " +
        "geometry values Layer 1 flags as `intentional-divergence` from box-ui-elements source.",
    );
    L.push("");
    L.push("| | Surface | box-open-elements | Real Box | Constant |");
    L.push("| --- | --- | --- | --- | --- |");
    for (const g of geometry) {
      L.push(
        `| ${ICON[g.verdict]} | ${g.surface} | ${g.boeValue} | ${g.boxValue} | \`${g.boeConst}\` |`,
      );
    }
    L.push("");
  }
  L.push(
    "Typography is a deliberate divergence (box-open-elements keeps `InterVariable`-first; " +
      "Box ships Lato) recorded in the reference's `observations`, not audited here.",
  );
  L.push("");
  return L.join("\n");
}

function main(): void {
  const strict = process.argv.includes("--strict");
  const reference = JSON.parse(readFileSync(REFERENCE, "utf8")) as Reference;
  const rows = evaluate(boxDefaultDesignSystem.tokens as Record<string, unknown>, reference);
  const geometry = evaluateGeometry(reference);

  writeFileSync(
    REPORT_JSON,
    `${JSON.stringify({ capturedFrom: reference.capturedFrom, capturedOn: reference.capturedOn, tokens: rows, geometry }, null, 2)}\n`,
  );
  writeFileSync(REPORT_MD, renderMarkdown(rows, reference, geometry));

  const by = (v: Verdict): number => rows.filter(r => r.verdict === v).length;
  const geoReview = geometry.filter(g => g.verdict !== "conformant").length;
  // eslint-disable-next-line no-console
  console.log(
    `BUE webapp conformance: ${by("conformant")} conformant, ${by("review")} review, ` +
      `${by("missing-boe")} missing (of ${rows.length} tokens); ` +
      `geometry ${geometry.length - geoReview}/${geometry.length} conformant. Report: ${REPORT_MD}`,
  );
  for (const r of rows.filter(x => x.verdict === "review")) {
    // eslint-disable-next-line no-console
    console.log(`  🔍 ${r.token}: box-open-elements ${r.boeCanonical} vs Box ${r.boxCanonical} (Δ${r.delta})`);
  }
  for (const g of geometry.filter(x => x.verdict !== "conformant")) {
    // eslint-disable-next-line no-console
    console.log(`  🔍 ${g.surface}: box-open-elements ${g.boeValue} vs Box ${g.boxValue}`);
  }

  // Strict mode now also gates on the live-Box geometry, so an intentional
  // divergence that stopped matching the app fails the audit.
  const code = computeExitCode([...rows, ...geometry], strict);
  if (code !== 0) process.exit(code);
}

if (import.meta.main) {
  main();
}
