import { describe, expect, it } from "vitest";
import { boxDefaultDesignSystem, boxDarkDesignSystem, normalizeDesignTokens } from "../../../src/foundations/tokens/index.js";

const rgb = (hex: string): number[] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = (color: number[]): number => color.map(v => v / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i]!, 0);
const contrast = (a: number[], b: number[]): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + .05) / (dark! + .05);
};

describe("semantic color pairs", () => {
  for (const theme of [boxDefaultDesignSystem, boxDarkDesignSystem]) {
    const t = theme.tokens!;
    it(`${theme.name}: on-brand text passes in every enabled state`, () => {
      for (const fill of ["SurfaceSurfaceBrand", "SurfaceSurfaceBrandHover", "SurfaceSurfaceBrandPressed"]) {
        expect(contrast(rgb(t.TextTextOnBrand!), rgb(t[fill]!)), fill).toBeGreaterThanOrEqual(4.5);
      }
    });
    it(`${theme.name}: feedback text and glyphs pass on alert and toast tints`, () => {
      for (const [fill, ink] of [["Success", "Success"], ["Error", "Error"], ["Inprogress", "Warning"]]) {
        for (const tint of [.1, .2]) {
          const base = rgb(t.SurfaceSurface!);
          const mixed = rgb(t[`SurfaceStatusSurface${fill}`]!).map((v, i) => v * tint + base[i]! * (1 - tint));
          expect(contrast(rgb(t.TextText!), mixed), `${fill}: body`).toBeGreaterThanOrEqual(4.5);
          expect(contrast(rgb(t.TextTextSecondary!), mixed), `${fill}: dismiss`).toBeGreaterThanOrEqual(3);
          expect(contrast(rgb(t[`TextStatusText${ink}`]!), mixed), `${fill}: glyph`).toBeGreaterThanOrEqual(3);
        }
        expect(contrast(rgb(t[`TextStatusText${ink}`]!), rgb(t.SurfaceSurface!))).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it("supports concise status token overrides", () => {
    expect(normalizeDesignTokens({ textStatusSuccess: "green", textStatusWarning: "amber", textStatusError: "red" }))
      .toEqual({ TextStatusTextSuccess: "green", TextStatusTextWarning: "amber", TextStatusTextError: "red" });
  });
});
