import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  boeFontFamily,
  boeType,
  boeTypeStyles,
  boeTypographyHostDeclaration,
} from "../../src/foundations/typography/index.js";

const root = process.cwd();

const filesUnder = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });

describe("typography foundation", () => {
  it("defines the authoritative Inter stack and measured product roles", () => {
    expect(boeFontFamily.fallback).toBe("InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif");
    expect(boeFontFamily.fallback).not.toContain("Lato");
    expect(boeType.pageHeading).toMatchObject({ fontSize: "21px", lineHeight: "32px", fontWeight: 700 });
    expect(boeType.dialogHeading).toMatchObject({ fontSize: "19px", lineHeight: "24px", fontWeight: 700 });
    expect(boeType.menuItem).toMatchObject({ fontSize: "15px", lineHeight: "20px", fontWeight: 400 });
    expect(boeType.body).toMatchObject({ fontSize: "14px", lineHeight: "20px", fontWeight: 400 });
    expect(boeType.label.letterSpacing).toBe("0");
    expect(boeTypographyHostDeclaration).toContain("--boe-token-font-family-base");
    expect(boeTypeStyles(".title", boeType.dialogHeading)).toContain("font-size: 19px");
  });

  it("makes every rendered component and pattern host consume the font token", () => {
    const files = [
      ...filesUnder(join(root, "src/components")),
      ...filesUnder(join(root, "src/patterns")),
    ].filter(file => readFileSync(file, "utf8").includes(":host {"));

    expect(files.length).toBeGreaterThan(100);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("--boe-token-font-family-base");
      expect(source, file).not.toContain("InterVariable, Lato");
    }
  });

  it("pins the licensed Inter Variable asset used by docs and visual regression", () => {
    const font = readFileSync(join(root, "docs-site/fonts/InterVariable.woff2"));
    const digest = createHash("sha256").update(font).digest("hex");
    const license = readFileSync(join(root, "docs-site/fonts/INTER-LICENSE.txt"), "utf8");
    const deterministicFonts = readFileSync(join(root, "tools/preview/deterministic-fonts.ts"), "utf8");

    expect(digest).toBe("693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3");
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(deterministicFonts).toContain("InterVariable.woff2");
    expect(deterministicFonts).not.toContain('dataUri("DejaVuSans.ttf")');
  });
});
