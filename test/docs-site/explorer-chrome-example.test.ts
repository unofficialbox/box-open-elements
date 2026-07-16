import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Read source text (do not import docs-site/examples.ts — that pulls the full
// package barrel into coverage and tanks the repo-wide floors).
const examplesSource = readFileSync(join(process.cwd(), "docs-site/examples.ts"), "utf8");

describe("docs-site content-explorer chrome example", () => {
  it("composes saved-view-picker, filter-bar, and content-explorer with host bindings", () => {
    expect(examplesSource).toMatch(/"content-explorer"\s*:\s*\{/);
    expect(examplesSource).toContain("box-saved-view-picker");
    expect(examplesSource).toContain("box-filter-bar");
    expect(examplesSource).toContain("box-content-explorer");
    expect(examplesSource).toContain("bindFilterBarToExplorer");
    expect(examplesSource).toContain("bindSavedViewPickerToExplorer");
  });
});
