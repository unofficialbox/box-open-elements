/**
 * Extraction backend CLI. Reads the authored stories, validates them against
 * the docs-site catalog identity, and writes the repo-owned generated JSON the
 * workshop (and, optionally, docs-site reference pages) render from.
 *
 * Exits non-zero on any identity/consistency error so CI catches drift.
 *
 * Usage: bun storybook/extract.ts
 */
import { join } from "node:path";
import { catalog, titleOf } from "../docs-site/registry.js";
import { storyModules } from "./registry.js";
import { extractStories } from "./extract-core.js";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT_FILE = join(ROOT, "storybook/generated/workshop.json");

const { stories, errors } = extractStories(storyModules, { catalog, titleOf });

if (errors.length > 0) {
  console.error("Story extraction failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

await Bun.write(OUT_FILE, `${JSON.stringify({ stories }, null, 2)}\n`);
console.log(`Extracted ${stories.length} stories → storybook/generated/workshop.json`);
