import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  bridgeStylesheet,
  createFileImportResolver,
  flattenSimpleNesting,
  type BridgeConfig,
} from "../../tools/style-bridge/bridge.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/style-bridge");
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BUE_LIB = join(REPO_ROOT, "tools/style-bridge/libraries/box-ui-elements");
const BUE_CONFIG = join(
  REPO_ROOT,
  "tools/style-bridge/configs/box-ui-elements/content-explorer.config.json",
);

const readFixture = (name: string): string => readFileSync(join(FIXTURE_DIR, name), "utf8");

describe("style bridge", () => {
  it("flattens simple SCSS nesting with &", () => {
    const flat = flattenSimpleNesting(`.be {
  &.bce {
    color: red;
  }
}`);
    expect(flat.replace(/\s+/g, " ")).toContain(".be.bce {");
    expect(flat).toContain("color: red;");
  });

  it("does not nest sibling rules under a closed parent", () => {
    const flat = flattenSimpleNesting(`.be {
  &.bce {
    .x { color: red; }
  }
}
.y { color: blue; }`);
    expect(flat).toContain(".be.bce .x");
    expect(flat).toContain(".y {\n  color: blue;\n}");
    // Sibling `.y` must remain a top-level rule, not combined under `.be`.
    expect(flat).not.toContain(".be.bce .y");
    expect(flat).not.toContain(".be .y");
  });

  it("resolves Sass partials and extensionless imports from disk", () => {
    const commonDir = join(BUE_LIB, "common");
    const resolveImport = createFileImportResolver(
      absolutePath => {
        try {
          return readFileSync(absolutePath, "utf8");
        } catch {
          return null;
        }
      },
      (fromDir, specifier) => resolve(fromDir, specifier),
      commonDir,
    );
    const contents = resolveImport("variables");
    expect(contents).toContain("$minimumWidth");
  });

  it("runs selector-bridge with imports, variables, selectors, and literals", () => {
    const config = JSON.parse(readFixture("selector-bridge.config.json")) as BridgeConfig;
    const source = readFixture("content-explorer.scss");
    const { css, report } = bridgeStylesheet(source, config, {
      resolveImport: specifier => {
        try {
          return readFixture(specifier);
        } catch {
          return null;
        }
      },
    });

    expect(report.inlinedImports).toContain("variables.scss");
    expect(report.missingVariables).toEqual([]);
    expect(css).toContain("box-content-explorer");
    expect(css).toContain("var(--boe-content-explorer-min-width, 300px)");
    expect(css).toContain("var(--boe-token-surface-surface-brand, #0061d5)");
    expect(css).not.toContain("$explorer-min-width");
    // No corrupted leftover definition fragments from substituting `$name:` sites.
    expect(css).not.toMatch(/^\s*\d+px\s*:/m);
    expect(css).not.toMatch(/^\s*#[0-9a-fA-F]{3,8}\s*:/m);
    expect(report.appliedSelectorMappings).toBeGreaterThan(0);
    expect(report.appliedDeclarationMappings).toBeGreaterThan(0);
  });

  it("substitutes references and strips Sass variable definitions", () => {
    const { css } = bridgeStylesheet(`$brand: #0061d5;\n.x { color: $brand; }`, {
      mode: "selector-bridge",
      selectorMap: {},
      variableMap: { brand: "#0061d5" },
    });
    expect(css).not.toContain("$brand");
    expect(css).toContain("color: #0061d5;");
  });

  it("runs token-bridge prefix and token() remaps with alias block", () => {
    const config = JSON.parse(readFixture("token-bridge.config.json")) as BridgeConfig;
    const { css, report } = bridgeStylesheet(readFixture("tokens-in.css"), config);

    expect(css).toContain("--boe-token-surface-surface");
    expect(css).not.toContain("--obp-");
    expect(css).toContain("var(--boe-token-surface-surface-brand, #0061d5)");
    expect(css).toContain("--boe-brand:");
    expect(report.appliedPrefixRemaps).toBeGreaterThan(0);
    expect(report.appliedTokenFns).toBe(1);
  });

  it("records unresolved imports and missing variables", () => {
    const { report } = bridgeStylesheet(
      `@import 'missing.scss';\n.x { color: $nope; }`,
      {
        mode: "selector-bridge",
        selectorMap: {},
        variableMap: {},
      },
      { resolveImport: () => null },
    );
    expect(report.unresolvedImports).toContain("missing.scss");
    expect(report.missingVariables).toContain("nope");
  });

  it("bridges the box-ui-elements content-explorer library snapshot", () => {
    const config = JSON.parse(readFileSync(BUE_CONFIG, "utf8")) as BridgeConfig;
    const entryDir = join(BUE_LIB, "content-explorer");
    const source = readFileSync(join(entryDir, "index.scss"), "utf8");
    const { css, report } = bridgeStylesheet(source, config, {
      resolveImport: createFileImportResolver(
        absolutePath => {
          try {
            return readFileSync(absolutePath, "utf8");
          } catch {
            return null;
          }
        },
        (fromDir, specifier) => resolve(fromDir, specifier),
        entryDir,
      ),
    });

    expect(report.unresolvedImports).toEqual([]);
    expect(report.missingVariables).toEqual([]);
    expect(css).toContain("box-content-explorer {");
    expect(css).toContain("box-content-explorer::part(main)");
    expect(css).toContain("box-content-explorer::part(footer)");
    expect(css).toContain("var(--boe-content-explorer-min-width, 300px)");
    expect(css).toContain("var(--boe-token-stroke-stroke, var(--border-divider-border))");
    expect(css).not.toContain("$minimumWidth");
    expect(css).not.toMatch(/box-content-explorer\s+box-content-explorer::part/);
    expect(report.appliedSelectorMappings).toBeGreaterThan(0);
    expect(report.appliedDeclarationMappings).toBeGreaterThan(0);
  });
});
