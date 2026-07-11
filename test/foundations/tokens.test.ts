import { describe, expect, it } from "vitest";

import {
  applyDesignTokens,
  boxDefaultDesignSystem,
  createDesignTokenStyleText,
  registerBoxDefaultDesignSystem,
  registerDesignSystem,
  resolveDesignIcon,
  setActiveDesignSystem,
} from "../../src/foundations/tokens/index.js";

describe("foundations/tokens", () => {
  it("applies tokens as kebab-cased custom properties with the boe prefix", () => {
    const target = document.createElement("div");

    const applied = applyDesignTokens(target, { SurfaceSurfaceBrand: "#0061d5" });

    expect(applied).toEqual(["--boe-token-surface-surface-brand"]);
    expect(target.style.getPropertyValue("--boe-token-surface-surface-brand")).toBe("#0061d5");
  });

  it("creates a stylesheet block for SSR usage", () => {
    const styleText = createDesignTokenStyleText(
      { TextText: "#101820" },
      { selector: ":host" },
    );

    expect(styleText).toBe(":host {\n  --boe-token-text-text: #101820;\n}");
  });

  it("registers and activates the Box default design system", () => {
    registerBoxDefaultDesignSystem({ setActive: true });

    expect(resolveDesignIcon("info")).toContain("<svg");
    expect(boxDefaultDesignSystem.tokens?.SurfaceSurfaceBrand).toBe("#0061d5");
  });

  it("rejects activating an unregistered design system", () => {
    registerDesignSystem({ name: "acme", tokens: { BrandPrimary: "#5b4bff" } });
    setActiveDesignSystem("acme");

    expect(() => setActiveDesignSystem("does-not-exist")).toThrow(/Unknown design system/);
  });
});
