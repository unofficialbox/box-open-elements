import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  bridgeStylesheet,
  flattenSimpleNesting,
  type BridgeConfig,
} from "../../tools/style-bridge/bridge.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/style-bridge");

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
});
