import { describe, expect, it } from "vitest";

import {
  boeBrandInteractiveStyles,
  boeFocusRingShadow,
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../../src/foundations/tokens/interaction.js";

describe("interaction style helpers", () => {
  it("exposes a brand-token focus ring with opaque fallback contrast", () => {
    expect(boeFocusRingShadow).toContain("--boe-token-surface-surface-brand");
    expect(boeFocusRingShadow).toContain("#0061d5");
    expect(boeFocusRingShadow).not.toContain("color-mix");
    expect(boeFocusRingShadow).not.toContain("transparent");
  });

  it("builds neutral interactive states for a selector", () => {
    const css = boeNeutralInteractiveStyles('[part="trigger"]');
    expect(css).toContain('[part="trigger"]:focus-visible');
    expect(css).toContain('[part="trigger"]:hover:not(:disabled)');
    expect(css).toContain('[part="trigger"]:active:not(:disabled)');
    expect(css).toContain('[part="trigger"]:disabled');
    expect(css).toContain("--boe-token-surface-surface-hover");
  });

  it("builds brand interactive states for a selector", () => {
    const css = boeBrandInteractiveStyles('[part="confirm"]');
    expect(css).toContain('[part="confirm"]:hover:not(:disabled)');
    expect(css).toContain("--boe-token-surface-surface-brand-hover");
    expect(css).toContain("--boe-token-surface-surface-brand-pressed");
  });

  it("builds focus-only styles when hover is owned elsewhere", () => {
    const css = boeFocusVisibleStyles('[part="input"]');
    expect(css).toContain(':focus-visible');
    expect(css).not.toContain(':hover');
  });
});
