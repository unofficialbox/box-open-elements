// @vitest-environment node

import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

/**
 * Every element entry must be reachable from the package barrel.
 *
 * The docs site imports `@unofficialbox/box-open-elements` once and relies on
 * that import to register every custom element. A component missing from the
 * barrel therefore does not register, its tag never upgrades, and its docs page
 * renders an inert empty element — which is exactly what happened to
 * `box-contact-datalist-item`: a blank preview, no console error, no failing
 * test. One of 135 tags, silently.
 *
 * Comparing entry files against the barrel's re-exports catches that at build
 * time instead of leaving it to someone noticing an empty box on the site.
 */
describe("package barrel", () => {
  it("re-exports a module for every element entry", async () => {
    const barrel = await readFile("src/index.ts", "utf8");
    const entries = (await readdir("src/entries")).filter(file => file.endsWith(".ts"));
    expect(entries.length).toBeGreaterThan(100);

    // Each entry re-exports its component module; the barrel must reach the
    // same module. Compare on the module path the entry itself points at,
    // rather than on the slug, because the barrel groups by directory.
    const missing: string[] = [];
    for (const entry of entries) {
      const source = await readFile(`src/entries/${entry}`, "utf8");
      const paths = [...source.matchAll(/from "(\.\.\/[^"]+)"/g)].map(match => match[1] as string);
      const componentPaths = paths.filter(path => path.includes("/components/"));
      if (componentPaths.length === 0) continue;

      const reachable = componentPaths.some(path => {
        const normalized = path.replace(/^\.\.\//, "./");
        return barrel.includes(normalized);
      });
      if (!reachable) missing.push(entry.replace(/\.ts$/, ""));
    }

    expect(missing, `entries unreachable from src/index.ts: ${missing.join(", ")}`).toEqual([]);
  });
});
