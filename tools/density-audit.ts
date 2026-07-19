#!/usr/bin/env bun
/**
 * Full-catalog density audit.
 * 1) Absolute fat thresholds vs segmented-control bands
 * 2) Peer-variance summary for same-role chrome (pad/radius/gap/title)
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
].filter(
  f =>
    !f.endsWith("/index.ts") &&
    !f.includes("/types.ts") &&
    !f.includes("/contracts.ts") &&
    !f.includes("/controller.ts") &&
    !f.includes("/host-bindings.ts") &&
    !f.includes("/provider-adapter.ts") &&
    !f.includes("/content-preview-adapter.ts") &&
    !f.includes("/box-transport.ts"),
);

type Hit = { prop: string; val: string; max: number; severity: "high" | "med" | "low" };

const classify = (prop: string, val: string, max: number): Hit["severity"] | null => {
  const pill = val.includes("999");
  if (prop === "min-block-size" || prop === "min-height" || prop === "block-size") {
    return null;
  }
  if (["padding", "padding-block", "padding-inline"].includes(prop) && /em\b/.test(val) && !/rem\b/.test(val)) {
    return null;
  }
  if (
    ["padding", "padding-block", "padding-inline"].includes(prop) &&
    /2(?:\.\d+)?rem/.test(val) &&
    /0\.[3-5]\d*rem/.test(val)
  ) {
    return null;
  }
  if (["padding", "padding-block", "padding-inline"].includes(prop)) {
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

// ── Peer variance (same-role distinct value camps) ───────────────────────────

type Role = "overlay-shell" | "feedback-shell" | "form-control" | "pattern-shell" | "list-row" | "menu-item";

const roleOf = (file: string): Role | null => {
  if (/overlays\/(dialog|drawer|popover)\.ts$/.test(file)) return "overlay-shell";
  if (/feedback\/(empty-state|error-mask|alert|toast|nudge)\.ts$/.test(file)) return "feedback-shell";
  if (/forms\/(text-field|text-area|number-input|select|dropdown|combobox|search-field|spin-button|date-field|time-field)\.ts$/.test(file)) {
    return "form-control";
  }
  if (/patterns\/.+\.ts$/.test(file) && !/adapters\//.test(file) && !/controller|contracts|types|box-transport/.test(file)) {
    return "pattern-shell";
  }
  if (/content-explorer\/content-explorer\.ts$/.test(file)) return "pattern-shell";
  if (/(datalist-item|contact-datalist-item|adapters\/list|collections\/tree|draggable-list)\.ts$/.test(file)) {
    return "list-row";
  }
  if (/(actions\/menu-item|forms\/dropdown|adapters\/action-menu)\.ts$/.test(file)) return "menu-item";
  return null;
};

const extractShellPad = (text: string): string | null => {
  // Prefer :host or first prominent padding on a part shell.
  const host = text.match(/:host\s*\{[^}]*?padding:\s*([^;]+);/s);
  if (host) return host[1].trim();
  const part = text.match(/\[part="(?:panel|dialog|drawer|shell|surface|card|root)"\]\s*\{[^}]*?padding:\s*([^;]+);/s);
  if (part) return part[1].trim();
  const any = text.match(/padding:\s*([^;]+);/);
  return any ? any[1].trim() : null;
};

const extractShellRadius = (text: string): string | null => {
  const host = text.match(/:host\s*\{[^}]*?border-radius:\s*([^;]+);/s);
  if (host && !host[1].includes("999")) return host[1].trim();
  const part = text.match(/\[part="(?:panel|dialog|drawer|shell|surface|card|root)"\]\s*\{[^}]*?border-radius:\s*([^;]+);/s);
  if (part && !part[1].includes("999")) return part[1].trim();
  const any = text.match(/border-radius:\s*([^;]+);/);
  if (any && !any[1].includes("999")) return any[1].trim();
  return null;
};

type PeerCamp = { role: Role; prop: "padding" | "border-radius"; values: Record<string, string[]> };

const peerCamps: PeerCamp[] = [];
const byRole: Record<Role, { file: string; pad: string | null; radius: string | null }[]> = {
  "overlay-shell": [],
  "feedback-shell": [],
  "form-control": [],
  "pattern-shell": [],
  "list-row": [],
  "menu-item": [],
};

for (const file of files) {
  const rel = relative(ROOT, file);
  const role = roleOf(rel);
  if (!role) continue;
  const text = readFileSync(file, "utf8");
  byRole[role].push({
    file: rel,
    pad: extractShellPad(text),
    radius: extractShellRadius(text),
  });
}

const variance: Array<{
  role: Role;
  prop: "padding" | "border-radius";
  distinct: number;
  camps: Record<string, string[]>;
}> = [];

for (const role of Object.keys(byRole) as Role[]) {
  for (const prop of ["padding", "border-radius"] as const) {
    const camps: Record<string, string[]> = {};
    for (const entry of byRole[role]) {
      const val = prop === "padding" ? entry.pad : entry.radius;
      if (!val) continue;
      (camps[val] ??= []).push(entry.file);
    }
    const distinct = Object.keys(camps).length;
    if (distinct > 1) {
      variance.push({ role, prop, distinct, camps });
    }
  }
}

variance.sort((a, b) => b.distinct - a.distinct || a.role.localeCompare(b.role));

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
    overlayShellPad: "0.75rem",
    patternShellPad: "0.7rem",
    listRowPad: "0.5rem 0.65rem",
  },
  thresholds: {
    high: "pad>1.1 / radius≥1 / gap≥1 / title>1.5",
    med: "pad>1.0 / radius≥0.9 / gap≥0.85 / title>1.35",
    low: "pad>0.75 / radius>0.75 / gap>0.65 / title>1.15",
  },
  scannedFiles: files.length,
  fatFiles: findings.length,
  totals: {
    high: findings.reduce((s, f) => s + f.high, 0),
    med: findings.reduce((s, f) => s + f.med, 0),
    low: findings.reduce((s, f) => s + f.low, 0),
  },
  peerVariance: variance,
  files: findings.map(f => ({
    file: f.file,
    score: f.score,
    high: f.high,
    med: f.med,
    low: f.low,
    hits: f.hits.map(h => `${h.severity}:${h.prop}=${h.val}`),
  })),
};

const outDir = join(ROOT, "tmp");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "density-audit-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Scanned ${files.length} element files; ${findings.length} with fat tokens`);
console.log(`Totals: high=${report.totals.high} med=${report.totals.med} low=${report.totals.low}`);
console.log(`Peer-variance camps: ${variance.length} role/prop pairs with >1 distinct value`);
console.log(`Wrote ${relative(ROOT, outPath)}\n`);
console.log("TOP 40 by fat score:");
for (const f of findings.slice(0, 40)) {
  console.log(`${String(f.score).padStart(3)} H${f.high}M${f.med}L${f.low}  ${f.file}`);
  console.log(`    ${f.hits.slice(0, 6).map(h => `${h.severity}:${h.prop}=${h.val}`).join(" | ")}`);
}
console.log("\nPeer variance (distinct camps > 1):");
for (const v of variance.slice(0, 20)) {
  console.log(`  ${v.role} ${v.prop}: ${v.distinct} camps`);
  for (const [val, filesForVal] of Object.entries(v.camps).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    ${val}  (${filesForVal.length}) ${filesForVal.slice(0, 4).join(", ")}${filesForVal.length > 4 ? "…" : ""}`);
  }
}
console.log(`\nClean (no fat hits): ${files.length - findings.length}`);
