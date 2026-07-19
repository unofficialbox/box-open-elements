import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { replaceOnce, rewriteIndexHtml } from "../../docs-site/build-helpers.js";

// vitest runs with the repo root as cwd.
const indexHtml = readFileSync(join(process.cwd(), "docs-site/index.html"), "utf8");

describe("replaceOnce", () => {
  it("replaces a single occurrence", () => {
    expect(replaceOnce("a X b", "X", "Y")).toBe("a Y b");
  });

  it("throws when the anchor is missing (fail-fast, never ship a broken page)", () => {
    expect(() => replaceOnce("abc", "X", "Y")).toThrow();
  });

  it("throws when the anchor appears more than once", () => {
    expect(() => replaceOnce("X and X", "X", "Y")).toThrow();
  });
});

describe("rewriteIndexHtml", () => {
  it("rewrites server-absolute asset refs to relative (host-agnostic)", () => {
    const out = rewriteIndexHtml(indexHtml, true);
    expect(out).toContain('href="./styles.css"');
    expect(out).toContain('src="./main.js"');
    expect(out).not.toContain("/docs-site/");
  });

  it("points the importmap at the copied library tree", () => {
    const out = rewriteIndexHtml(indexHtml, true);
    expect(out).toContain('"@unofficialbox/box-open-elements": "./lib/index.js"');
    expect(out).not.toContain("/dist/index.js");
  });

  it("adds the workshop link only when the workshop is included", () => {
    expect(rewriteIndexHtml(indexHtml, true)).toContain('href="./workshop/"');
    expect(rewriteIndexHtml(indexHtml, false)).not.toContain('href="./workshop/"');
  });

  it("throws if an expected anchor is missing from the source", () => {
    expect(() => rewriteIndexHtml("<html>no anchors</html>", true)).toThrow();
  });
});
