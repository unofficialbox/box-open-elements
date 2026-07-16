import { describe, expect, it } from "vitest";

import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
  boeTransition,
} from "../../src/foundations/motion/index.js";

describe("motion foundation", () => {
  it("exposes a stable duration / easing vocabulary", () => {
    expect(boeMotionDuration.fast).toBe("120ms");
    expect(boeMotionDuration.interactive).toBe("140ms");
    expect(boeMotionDuration.medium).toBe("160ms");
    expect(boeMotionDuration.spin).toBe("0.8s");
    expect(boeMotionEasing.standard).toBe("ease");
    expect(boeMotionEasing.linear).toBe("linear");
  });

  it("builds transition shorthand from the vocabulary", () => {
    expect(boeTransition("opacity")).toBe("opacity 120ms ease");
    expect(boeTransition("opacity", boeMotionDuration.interactive)).toBe("opacity 140ms ease");
    expect(boeTransition("opacity", boeMotionDuration.medium, boeMotionEasing.enter)).toBe(
      "opacity 160ms ease-out",
    );
  });

  it("emits a prefers-reduced-motion media query block", () => {
    const css = boeReducedMotionStyles('[part="indicator"]', "animation: none;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain('[part="indicator"]');
    expect(css).toContain("animation: none;");
  });
});
