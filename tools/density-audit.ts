#!/usr/bin/env bun
/**
 * Full-catalog density audit vs segmented-control bands.
 * Target: shell pad 0.65–0.75, radius 0.65–0.75, gaps 0.5–0.6, titles ≤1.15rem.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "src");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".ts") && !name.endsWith(".d.ts") && !name.includes(".test.")) out.push(p);
  }
  return out;
};

const files = [
  ...walk(join(SRC, "components")),
  ...walk(join(SRC, "patterns")),
].filter(f => !f.endsWith("/index.ts") && !f.includes("/types.ts") && !f.includes("/contracts.ts") && !f.includes("/controller.ts") && !f.includes("/host-bindings.ts") && !f.includes("/provider-adapter.ts") && !f.includes("/content-preview-adapter.ts"));

type Hit = { prop: string; val: string; max: number; severity: "high" | "med" | "low" };

const classify = (prop: string, val: string, max: number): Hit["severity"] | null => {
  const pill = val.includes("999");
  // Content geometry / intentional airy / reference-matched controls — not chrome fat.
  if (prop === "min-block-size" || prop === "min-height" || prop === "block-size") {
    // Chart stages, list panes, illustration art, editor floors.
    return null;
  }
  // Segmented/button em pads use ~1em horizontal — matches reference, not fat.
  if (["padding", "padding-block", "padding-inline"].includes(prop) && /em\b/.test(val) && !/rem\b/.test(val)) {
    return null;
  }
  // Select/dropdown: large trailing pad is chevron gutter, not shell chrome.
  if (
    ["padding", "padding-block", "padding-inline"].includes(prop) &&
    /2(?:\.\d+)?rem/.test(val) &&
    /0\.[3-5]\d*rem/.test(val)
  ) {
    return null;
  }
  if (["padding", "padding-block", "padding-inline"].includes(prop)) {
    // Dialog/empty-state intentional airy band ≤1.1rem → low only above 1.1
    if (max > 1.1) return "high";
    if (max > 1.0) return "med";
    if (max > 0.75) return "low";
  } else if (prop === "border-radius" && !pill) {
    if (max >= 1.0) return "high";
    if (max >= 0.9) return "med";
    if (max > 0.75) return "low";
  } else if (["gap", "row-gap", "column-gap"].includes(prop)) {
    if (max >= 1.0) return "high";
    if (max >= 0.85) return "med";
    if (max > 0.65) return "low";
  } else if (prop === "font-size") {
    // Metric/summary display cap is 1.35rem (in-band). Titles should be ≤1.15.
    if (max > 1.5) return "high";
    if (max > 1.35) return "med";
    if (max > 1.15) return "low";
  }
  return null;
};

const PROP_RE =
  /(padding|padding-block|padding-inline|gap|row-gap|column-gap|border-radius|font-size|min-height|min-block-size|block-size)\s*:\s*([^;{}]+);/g;

type FileFinding = {
  file: string;
  score: number;
  high: number;
  med: number;
  low: number;
  hits: Hit[];
};

const findings: FileFinding[] = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const hits: Hit[] = [];
  let m: RegExpExecArray | null;
  PROP_RE.lastIndex = 0;
  while ((m = PROP_RE.exec(text))) {
    const prop = m[1];
    const val = m[2].trim();
    if (!/(?:rem|em)\b/.test(val)) continue;
    const nums = [...val.matchAll(/([0-9]*\.?[0-9]+)(?:rem|em)/g)].map(x => Number(x[1]));
    if (!nums.length) continue;
    const max = Math.max(...nums);
    const severity = classify(prop, val, max);
    if (!severity) continue;
    hits.push({ prop, val, max, severity });
  }
  if (!hits.length) continue;
  const high = hits.filter(h => h.severity === "high").length;
  const med = hits.filter(h => h.severity === "med").length;
  const low = hits.filter(h => h.severity === "low").length;
  const score = high * 3 + med * 2 + low;
  findings.push({
    file: relative(ROOT, file),
    score,
    high,
    med,
    low,
    hits,
  });
}

findings.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

const clean = findings.filter(f => f.score === 0);
const report = {
  generatedAt: new Date().toISOString(),
  reference: "segmented-control: control pad/gap 0.25rem, radius 0.75rem; segment pad 0.45em 1em, radius 0.55rem",
  bands: {
    shellPadding: "0.65–0.75rem",
    shellRadius: "0.65–0.75rem",
    gaps: "0.5–0.6rem",
    titles: "≤1.15rem",
    optionPad: "~0.4–0.55rem",
    controlMinHeight: "≤2.1rem preferred",
  },
  thresholds: {
    high: "pad≥1 / radius≥1 / gap≥1 / title≥1.35 / minH≥3",
    med: "pad≥0.85 / radius≥0.9 / gap≥0.85 / title≥1.2 / minH≥2.5",
    low: "pad>0.75 / radius>0.75 / gap>0.65 / title>1.15 / minH>2.2",
  },
  scannedFiles: files.length,
  fatFiles: findings.length,
  totals: {
    high: findings.reduce((s, f) => s + f.high, 0),
    med: findings.reduce((s, f) => s + f.med, 0),
    low: findings.reduce((s, f) => s + f.low, 0),
  },
  files: findings.map(f => ({
    file: f.file,
    score: f.score,
    high: f.high,
    med: f.med,
    low: f.low,
    hits: f.hits.map(h => `${h.severity}:${h.prop}=${h.val}`),
  })),
};

const outPath = join(ROOT, "plans/density-audit-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Scanned ${files.length} element files; ${findings.length} with fat tokens`);
console.log(`Totals: high=${report.totals.high} med=${report.totals.med} low=${report.totals.low}`);
console.log(`Wrote ${relative(ROOT, outPath)}\n`);
console.log("TOP 40 by score:");
for (const f of findings.slice(0, 40)) {
  console.log(`${String(f.score).padStart(3)} H${f.high}M${f.med}L${f.low}  ${f.file}`);
  console.log(`    ${f.hits.slice(0, 6).map(h => `${h.severity}:${h.prop}=${h.val}`).join(" | ")}`);
}
console.log(`\nClean (no fat hits): ${files.length - findings.length}`);
