#!/usr/bin/env bun
/**
 * Opportunistic motion-literal migration.
 * Replaces hard-coded 120/140/160/240ms (+ ease) inside backtick CSS template
 * strings with foundations/motion constants. Adds imports when missing.
 * Quoted strings and comments outside templates are left unchanged.
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

const migrateTemplate = (template: string): string => {
  let text = template;
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
  return text;
};

/**
 * Rewrite duration literals only inside backtick-delimited template literals.
 * Skips escaped backticks (\`) and does not touch "..." / '...' strings or comments.
 */
const migrateTemplateLiterals = (source: string): { text: string; count: number } => {
  let out = "";
  let i = 0;
  let count = 0;

  while (i < source.length) {
    const ch = source[i];

    // Skip line comments
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      const sliceEnd = end === -1 ? source.length : end + 1;
      out += source.slice(i, sliceEnd);
      i = sliceEnd;
      continue;
    }

    // Skip block comments
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      const sliceEnd = end === -1 ? source.length : end + 2;
      out += source.slice(i, sliceEnd);
      i = sliceEnd;
      continue;
    }

    // Skip single-quoted strings
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      out += source.slice(i, j);
      i = j;
      continue;
    }

    // Migrate backtick template literals
    if (ch === "`") {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === "`") {
          j += 1;
          break;
        }
        j += 1;
      }
      const raw = source.slice(i, j);
      const inner = raw.slice(1, -1);
      const migratedInner = migrateTemplate(inner);
      const hits = (inner.match(/\b(120|140|160|240)ms\b/g) ?? []).length;
      count += hits;
      out += `\`${migratedInner}\``;
      i = j;
      continue;
    }

    out += ch;
    i += 1;
  }

  return { text: out, count };
};

let changedFiles = 0;
let replacements = 0;

for (const file of files) {
  let text = readFileSync(file, "utf8");
  const original = text;

  // Skip files with no duration literals
  if (!/\b(120|140|160|240)ms\b/.test(text)) continue;

  const { text: migrated, count } = migrateTemplateLiterals(text);
  if (migrated === text || count === 0) continue;

  text = migrated;
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
