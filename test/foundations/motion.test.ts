import { describe, expect, it } from "vitest";

import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
  boeTransition,
} from "../../src/foundations/motion/index.js";

describe("motion foundation", () => {
  it("exposes a stable duration / easing vocabulary", () => {
    expect(boeMotionDuration.fast).toBe("var(--boe-profile-motion-fast, 120ms)");
    expect(boeMotionDuration.interactive).toBe("var(--boe-profile-motion-interactive, 140ms)");
    expect(boeMotionDuration.medium).toBe("var(--boe-profile-motion-medium, 160ms)");
    expect(boeMotionDuration.spin).toBe("var(--boe-profile-motion-spin, 0.8s)");
    expect(boeMotionEasing.standard).toBe("var(--boe-profile-easing-standard, ease)");
    expect(boeMotionEasing.linear).toBe("var(--boe-profile-easing-linear, linear)");
  });

  it("builds transition shorthand from the vocabulary", () => {
    expect(boeTransition("opacity")).toBe(
      `opacity ${boeMotionDuration.fast} ${boeMotionEasing.standard}`,
    );
    expect(boeTransition("opacity", boeMotionDuration.interactive)).toBe(
      `opacity ${boeMotionDuration.interactive} ${boeMotionEasing.standard}`,
    );
    expect(boeTransition("opacity", boeMotionDuration.medium, boeMotionEasing.enter)).toBe(
      `opacity ${boeMotionDuration.medium} ${boeMotionEasing.enter}`,
    );
  });

  it("emits a prefers-reduced-motion media query block", () => {
    const css = boeReducedMotionStyles('[part="indicator"]', "animation: none;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain('[part="indicator"]');
    expect(css).toContain("animation: none;");
  });
});
