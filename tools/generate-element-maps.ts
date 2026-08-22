/**
 * Generates src/element-maps.ts: the global HTMLElementTagNameMap
 * augmentation that makes `document.createElement("box-button")` and
 * `querySelector("box-select")` return the right class in TypeScript —
 * for every element in the library, in any framework, with no wrapper.
 *
 * Usage: bun tools/generate-element-maps.ts
 *
 * The output is committed. CI (typecheck) fails if a new element's class
 * or tag drifts from the map, so regenerate after adding an element.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

interface ElementEntry {
  tag: string;
  className: string;
  importPath: string;
}

const entries: ElementEntry[] = [];

const walk = (dir: string): void => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith(".ts") || name.endsWith(".d.ts")) {
      continue;
    }
    const source = readFileSync(full, "utf8");
    const tagMatch = /const DEFAULT_TAG_NAME = "([a-z0-9-]+)"/.exec(source);
    if (!tagMatch) {
      continue;
    }
    // The class whose static tagName is the DEFAULT_TAG_NAME constant.
    const classMatch = /export class (\w+) extends [\w.]+ \{\s*\n\s*static (?:override )?readonly tagName/.exec(source);
    if (!classMatch) {
      continue;
    }
    const importPath = `./${relative(SRC, full).replace(/\.ts$/, ".js")}`;
    entries.push({ tag: tagMatch[1]!, className: classMatch[1]!, importPath });
  }
};

walk(SRC);
entries.sort((a, b) => a.tag.localeCompare(b.tag));

const seen = new Map<string, ElementEntry>();
for (const entry of entries) {
  const existing = seen.get(entry.tag);
  if (existing) {
    throw new Error(`duplicate tag ${entry.tag}: ${existing.importPath} and ${entry.importPath}`);
  }
  seen.set(entry.tag, entry);
}

// Alias classes whose names collide across files (none today, but a
// collision must fail loudly here rather than emit broken output).
const nameCounts = new Map<string, number>();
for (const entry of entries) {
  nameCounts.set(entry.className, (nameCounts.get(entry.className) ?? 0) + 1);
}
const collisions = [...nameCounts.entries()].filter(([, count]) => count > 1);
if (collisions.length > 0) {
  throw new Error(`class name collisions: ${collisions.map(([name]) => name).join(", ")}`);
}

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: bun tools/generate-element-maps.ts
 *
 * Global tag-name map: TypeScript resolves every box-* tag to its class in
 * createElement/querySelector, and JSX-free frameworks get typed elements
 * without a wrapper package. Type-only — this module emits no runtime code.
 */
`;

const imports = entries
  .map(entry => `import type { ${entry.className} } from "${entry.importPath}";`)
  .join("\n");

const mapLines = entries.map(entry => `    "${entry.tag}": ${entry.className};`).join("\n");

const unionLines = entries.map(entry => `  | "${entry.tag}"`).join("\n");

const output = `${header}${imports}

declare global {
  interface HTMLElementTagNameMap {
${mapLines}
  }
}

/** Every element tag the library registers, for host-side narrowing. */
export type BoxElementTagName =
${unionLines};
`;

writeFileSync(join(SRC, "element-maps.ts"), output);
console.log(`wrote src/element-maps.ts with ${String(entries.length)} tags`);
