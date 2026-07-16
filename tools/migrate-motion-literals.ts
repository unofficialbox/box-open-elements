#!/usr/bin/env bun
/**
 * Opportunistic motion-literal migration.
 * Replaces hard-coded 120/140/160/240ms (+ ease) in style template strings
 * with foundations/motion constants. Adds imports when missing.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";

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

const files = walk(SRC).filter(
  f =>
    !f.includes("/foundations/motion/") &&
    !f.endsWith("/index.ts") &&
    (f.includes("/components/") || f.includes("/patterns/")),
);

const relImport = (fromFile: string): string => {
  const fromDir = dirname(fromFile);
  const target = join(SRC, "foundations/motion/index.js");
  let rel = relative(fromDir, target).replaceAll("\\", "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
};

let changedFiles = 0;
let replacements = 0;

for (const file of files) {
  let text = readFileSync(file, "utf8");
  const original = text;

  // Skip files with no duration literals
  if (!/\b(120|140|160|240)ms\b/.test(text)) continue;

  const before = text;
  // Prefer multi-property transition lines first
  text = text.replaceAll("140ms ease", "${boeMotionDuration.interactive} ${boeMotionEasing.standard}");
  text = text.replaceAll("120ms ease", "${boeMotionDuration.fast} ${boeMotionEasing.standard}");
  text = text.replaceAll("160ms ease", "${boeMotionDuration.medium} ${boeMotionEasing.standard}");
  text = text.replaceAll("240ms ease", "${boeMotionDuration.slow} ${boeMotionEasing.standard}");
  // Bare durations (rare)
  text = text.replaceAll("140ms", "${boeMotionDuration.interactive}");
  text = text.replaceAll("120ms", "${boeMotionDuration.fast}");
  text = text.replaceAll("160ms", "${boeMotionDuration.medium}");
  text = text.replaceAll("240ms", "${boeMotionDuration.slow}");

  if (text === before) continue;

  const count = (before.match(/\b(120|140|160|240)ms\b/g) ?? []).length;
  replacements += count;

  const needsDuration = text.includes("boeMotionDuration.");
  const needsEasing = text.includes("boeMotionEasing.");
  const hasMotionImport = /from ["'].*foundations\/motion/.test(text);

  if ((needsDuration || needsEasing) && !hasMotionImport) {
    const importPath = relImport(file);
    const names = [
      needsDuration ? "boeMotionDuration" : null,
      needsEasing ? "boeMotionEasing" : null,
    ].filter(Boolean).join(", ");
    const importLine = `import { ${names} } from "${importPath}";\n`;

    // Insert after last top-level import
    const importBlock = text.match(/^(?:import[\s\S]*?from ["'][^"']+["'];\n)+/);
    if (importBlock) {
      const end = importBlock[0].length;
      text = text.slice(0, end) + importLine + text.slice(end);
    } else {
      text = importLine + text;
    }
  } else if (hasMotionImport && (needsDuration || needsEasing)) {
    // Ensure names are in the existing import
    text = text.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']([^"']*foundations\/motion[^"']*)["']\s*;/,
      (full, names, path) => {
        const set = new Set(
          names
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
        );
        if (needsDuration) set.add("boeMotionDuration");
        if (needsEasing) set.add("boeMotionEasing");
        return `import { ${[...set].join(", ")} } from "${path}";`;
      },
    );
  }

  if (text !== original) {
    writeFileSync(file, text);
    changedFiles += 1;
    console.log(`updated ${relative(ROOT, file)} (${count})`);
  }
}

console.log(`\nChanged ${changedFiles} files, ~${replacements} duration literals`);
