#!/usr/bin/env bun
/**
 * Peer-band density consistency pass.
 * Surgical rewrites so same-role surfaces share pad/radius/gap/title bands.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "src");

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
};

const files = [
  ...walk(join(SRC, "components")),
  ...walk(join(SRC, "patterns")),
].filter(f => !f.endsWith("/index.ts"));

type Rule = { match: RegExp | string; replace: Array<[string, string]> };

const RULES: Rule[] = [
  // P0 — overlay / feedback airy shells
  {
    match: /overlays\/(dialog|drawer)\.ts$/,
    replace: [
      ["padding: 1.05rem 1.05rem 0.85rem;", "padding: 0.75rem 0.75rem 0.65rem;"],
      ["padding: 1.05rem;", "padding: 0.75rem;"],
      ["padding: 1rem;", "padding: 0.75rem;"],
      ["padding: 0.35rem 0.8rem;", "padding: 0.35rem 0.7rem;"],
    ],
  },
  {
    match: /overlays\/popover\.ts$/,
    replace: [
      ["padding: 0.7rem 0.75rem;", "padding: 0.7rem;"],
      ["padding: 0.4rem 0.78rem;", "padding: 0.4rem 0.7rem;"],
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },
  {
    match: /feedback\/(empty-state|error-mask)\.ts$/,
    replace: [
      ["padding: 1.1rem 1rem;", "padding: 0.75rem;"],
      ["padding: 0.5rem 0.9rem;", "padding: 0.45rem 0.75rem;"],
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },
  {
    match: /feedback\/(toast|nudge)\.ts$/,
    replace: [
      ["gap: 0.65rem;", "gap: 0.55rem;"],
      ["padding: 0.55rem 0.65rem;", "padding: 0.55rem 0.7rem;"],
    ],
  },
  {
    match: /feedback\/alert\.ts$/,
    replace: [
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },

  // P0 — form control canon (text-field band)
  {
    match: /forms\/(select|dropdown)\.ts$/,
    replace: [
      ["border-radius: 0.65rem;", "border-radius: 0.7rem;"],
      ["gap: 0.35rem;", "gap: 0.45rem;"],
      ["padding: 0.4rem 2.1rem 0.4rem 0.7rem;", "padding: 0.45rem 2.1rem 0.45rem 0.7rem;"],
      ["padding: 0.4rem 2.1rem 0.4rem 0.6rem;", "padding: 0.45rem 2.1rem 0.45rem 0.7rem;"],
      ["padding: 0.4rem 2rem 0.4rem 0.6rem;", "padding: 0.45rem 2.1rem 0.45rem 0.7rem;"],
      ["padding: 0.55rem 0.7rem;", "padding: 0.5rem 0.7rem;"],
      ["border-radius: 0.5rem;", "border-radius: 0.55rem;"],
      ["padding: 0.35rem;", "padding: 0.4rem;"],
    ],
  },
  {
    match: /forms\/spin-button\.ts$/,
    replace: [
      ["padding: 0.6rem 0.5rem;", "padding: 0.45rem 0.5rem;"],
    ],
  },
  {
    match: /forms\/color-picker\.ts$/,
    replace: [
      ["border-radius: 0.55rem;", "border-radius: 0.7rem;"],
    ],
  },
  {
    match: /forms\/rich-text-input\.ts$/,
    replace: [
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },
  {
    match: /forms\/fieldset\.ts$/,
    replace: [
      ["margin: 0 0 0.85rem;", "margin: 0 0 0.5rem;"],
    ],
  },
  {
    match: /forms\/(slider|range-slider|multi-select)\.ts$/,
    replace: [
      ["gap: 0.6rem;", "gap: 0.45rem;"],
    ],
  },

  // P0 — actions / menus
  {
    match: /actions\/(menu-item|menu)\.ts$/,
    replace: [
      ["padding: 0.6rem 0.7rem;", "padding: 0.5rem 0.7rem;"],
      ["border-radius: 0.6rem;", "border-radius: 0.55rem;"],
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
      ["padding: 0.45rem;", "padding: 0.4rem;"],
    ],
  },
  {
    match: /actions\/icon-button\.ts$/,
    replace: [
      ["width: 2.25rem;", "width: 2rem;"],
      ["height: 2.25rem;", "height: 2rem;"],
      ["min-width: 2.25rem;", "min-width: 2rem;"],
      ["min-height: 2.25rem;", "min-height: 2rem;"],
    ],
  },
  {
    match: /actions\/link-button\.ts$/,
    replace: [
      ["border-radius: 0.6rem;", "border-radius: 0.55rem;"],
    ],
  },
  {
    match: /content-explorer\/adapters\/action-menu\.ts$/,
    replace: [
      ["border-radius: 0.7rem;", "border-radius: 0.7rem;"], // no-op keep
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },

  // P1 — pattern shells: camp B → camp A
  {
    match:
      /patterns\/(file-request\/file-request-builder|preview\/preview-element|governance\/governance-panel|task\/task-assignment-panel|insights\/(chart-panel|bar-chart))\.ts$/,
    replace: [
      ["padding: 0.6rem;", "padding: 0.7rem;"],
      ["border-radius: 0.65rem;", "border-radius: 0.7rem;"],
      ["padding: 0.45rem 0.75rem;", "padding: 0.4rem 0.7rem;"],
      ["font-size: 1.05rem;", "font-size: 1.1rem;"],
    ],
  },
  {
    match: /patterns\/item\/bulk-action-bar\.ts$/,
    replace: [
      ["padding: 0.65rem 0.75rem;", "padding: 0.7rem;"],
    ],
  },
  {
    match: /patterns\/preview\/annotation-toolbar\.ts$/,
    replace: [
      ["padding: 0.55rem;", "padding: 0.7rem;"],
      ["border-radius: 0.65rem;", "border-radius: 0.7rem;"],
      ["border-radius: 0.5rem;", "border-radius: 0.55rem;"],
    ],
  },
  {
    match: /content-explorer\/adapters\/toolbar\.ts$/,
    replace: [
      ["padding: 0.5rem 0.65rem;", "padding: 0.55rem 0.65rem;"],
      ["gap: 0.6rem;", "gap: 0.55rem;"],
    ],
  },
  {
    match: /patterns\/(search\/search-results-header|share\/access-stats|task\/review-queue-item)\.ts$/,
    replace: [
      ["font-size: 1.15rem;", "font-size: 1.1rem;"],
      ["font-size: 1.08rem;", "font-size: 1.1rem;"],
      ["gap: 0.6rem 0.75rem;", "gap: 0.55rem 0.65rem;"],
    ],
  },
  {
    match: /patterns\/insights\/metric-card\.ts$/,
    replace: [
      ["font-size: 0.98rem;", "font-size: 1.05rem;"],
    ],
  },
  {
    match: /patterns\/preview\/(annotation-thread|annotation-inspector|preview-header)\.ts$/,
    replace: [
      ["font-size: 1.15rem;", "font-size: 1.1rem;"],
    ],
  },
  {
    match: /patterns\/task\/review-queue-item\.ts$/,
    replace: [
      ["padding: 0.45rem 0.75rem;", "padding: 0.4rem 0.7rem;"],
    ],
  },
  {
    match: /patterns\/(file-request|governance|task|preview)\/.*\.ts$/,
    replace: [
      ["padding: 0.45rem 0.75rem;", "padding: 0.4rem 0.7rem;"],
    ],
  },

  // P2 — collection / list rows
  {
    match: /collections\/(datalist-item|tree|draggable-list|grid-view|tree-grid|card)\.ts$/,
    replace: [
      ["padding: 0.55rem 0.6rem;", "padding: 0.5rem 0.65rem;"],
      ["padding: 0.46rem 0.68rem;", "padding: 0.5rem 0.65rem;"],
      ["padding: 0.55rem 0.7rem;", "padding: 0.5rem 0.65rem;"],
      ["padding: 0.55rem 0.75rem;", "padding: 0.5rem 0.65rem;"],
      ["padding: 0.7rem 0.65rem;", "padding: 0.6rem 0.65rem;"],
      ["border-radius: 0.65rem;", "border-radius: 0.6rem;"],
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
      ["gap: 0.65rem;", "gap: 0.55rem;"],
    ],
  },
  {
    match: /identity\/contact-datalist-item\.ts$/,
    replace: [
      ["padding: 0.55rem 0.65rem;", "padding: 0.5rem 0.65rem;"],
      ["border-radius: 0.6rem;", "border-radius: 0.6rem;"],
    ],
  },
  {
    match: /content-explorer\/adapters\/list\.ts$/,
    replace: [
      ["padding: 0.55rem 0.6rem;", "padding: 0.5rem 0.65rem;"],
      ["font-size: 0.94rem;", "font-size: 0.9rem;"],
    ],
  },
  {
    match: /navigation\/accordion\.ts$/,
    replace: [
      // keep 0.65 accordion radius — intentional mid band
    ],
  },
  {
    match: /collections\/card\.ts$/,
    replace: [
      ["border-radius: 0.75rem;", "border-radius: 0.7rem;"],
    ],
  },
];

let changedFiles = 0;
let replacements = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  let text = readFileSync(file, "utf8");
  const original = text;

  for (const rule of RULES) {
    const ok = typeof rule.match === "string" ? rel === rule.match : rule.match.test(rel);
    if (!ok) continue;
    for (const [from, to] of rule.replace) {
      if (!from || from === to || !text.includes(from)) continue;
      const count = text.split(from).length - 1;
      text = text.replaceAll(from, to);
      replacements += count;
    }
  }

  if (text !== original) {
    writeFileSync(file, text);
    changedFiles += 1;
    console.log(`updated ${rel}`);
  }
}

console.log(`\nChanged ${changedFiles} files, ~${replacements} replacements`);
