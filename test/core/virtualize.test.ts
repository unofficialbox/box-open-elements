// @vitest-environment node

import { describe, expect, it } from "vitest";

import { resolveRowWindow, sameRowWindow } from "../../src/core/virtualize.js";
import type { WindowMetrics } from "../../src/core/virtualize.js";

const metrics = (overrides: Partial<WindowMetrics> = {}): WindowMetrics => ({
  totalRows: 10_000,
  rowHeight: 32,
  viewportHeight: 640,
  scrollTop: 0,
  overscan: 4,
  ...overrides,
});

describe("resolveRowWindow", () => {
  it("renders a small slice of a huge collection", () => {
    const window = resolveRowWindow(metrics());
    // 640/32 = 20 visible + 1 straddling + 4 overscan each side, clamped at the top.
    expect(window.startIndex).toBe(0);
    expect(window.endIndex).toBe(25);
    expect(window.endIndex - window.startIndex).toBeLessThan(30);
  });

  it("keeps the scroll range constant as the window moves", () => {
    // The invariant that makes the scrollbar trustworthy: whatever slice is
    // rendered, the spacers plus the rows always sum to the full height. A
    // windowed list whose height wobbles makes the scrollbar jump.
    for (const scrollTop of [0, 100, 5_000, 160_000, 319_360]) {
      const window = resolveRowWindow(metrics({ scrollTop }));
      const rendered = (window.endIndex - window.startIndex) * 32;
      expect(window.paddingTop + rendered + window.paddingBottom).toBe(window.totalHeight);
      expect(window.totalHeight).toBe(10_000 * 32);
    }
  });

  it("always covers the visible band", () => {
    // Overscan may add rows; it must never subtract one the viewport shows.
    for (const scrollTop of [0, 37, 1_000, 12_345, 200_000]) {
      const window = resolveRowWindow(metrics({ scrollTop, overscan: 0 }));
      const firstVisible = Math.floor(scrollTop / 32);
      const lastVisible = Math.min(9_999, Math.floor((scrollTop + 640 - 1) / 32));
      expect(window.startIndex).toBeLessThanOrEqual(firstVisible);
      expect(window.endIndex).toBeGreaterThan(lastVisible);
    }
  });

  it("moves the window as the viewport scrolls", () => {
    const top = resolveRowWindow(metrics({ scrollTop: 0 }));
    const middle = resolveRowWindow(metrics({ scrollTop: 3_200 })); // row 100
    expect(middle.startIndex).toBe(96); // 100 - 4 overscan
    expect(middle.paddingTop).toBe(96 * 32);
    expect(middle.startIndex).toBeGreaterThan(top.startIndex);
  });

  it("clamps at the end of the collection", () => {
    const window = resolveRowWindow(metrics({ scrollTop: 10_000 * 32 }));
    expect(window.endIndex).toBe(10_000);
    expect(window.paddingBottom).toBe(0);
    expect(window.startIndex).toBeGreaterThan(9_950);
  });

  it("clamps a bounced or over-scrolled offset", () => {
    // Rubber-banding reports negative and past-the-end offsets; neither may
    // produce a window outside the collection. Without an offset clamp, a
    // past-the-end scroll drives startIndex far beyond endIndex — an inverted
    // slice and a paddingTop many times the real height — so the ordering and
    // the height invariant are the assertions that matter here, not just the
    // clamped edge.
    const negative = resolveRowWindow(metrics({ scrollTop: -500 }));
    expect(negative.startIndex).toBe(0);
    expect(negative.paddingTop).toBe(0);
    expect(negative.startIndex).toBeLessThanOrEqual(negative.endIndex);
    expect(
      negative.paddingTop +
        (negative.endIndex - negative.startIndex) * 32 +
        negative.paddingBottom,
    ).toBe(negative.totalHeight);

    const past = resolveRowWindow(metrics({ scrollTop: 10_000_000 }));
    expect(past.endIndex).toBe(10_000);
    expect(past.paddingBottom).toBe(0);
    expect(past.startIndex).toBeLessThanOrEqual(past.endIndex);
    expect(past.paddingTop).toBeLessThanOrEqual(past.totalHeight);
    expect(
      past.paddingTop + (past.endIndex - past.startIndex) * 32 + past.paddingBottom,
    ).toBe(past.totalHeight);
  });

  it("renders everything when the collection fits the viewport", () => {
    const window = resolveRowWindow(metrics({ totalRows: 5 }));
    expect(window).toEqual({
      startIndex: 0,
      endIndex: 5,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 160,
    });
  });

  it("honours overscan, and treats a negative overscan as none", () => {
    const none = resolveRowWindow(metrics({ scrollTop: 3_200, overscan: 0 }));
    const wide = resolveRowWindow(metrics({ scrollTop: 3_200, overscan: 10 }));
    expect(none.startIndex).toBe(100);
    expect(wide.startIndex).toBe(90);
    expect(wide.endIndex - wide.startIndex).toBeGreaterThan(none.endIndex - none.startIndex);

    const negative = resolveRowWindow(metrics({ scrollTop: 3_200, overscan: -5 }));
    expect(negative.startIndex).toBe(100);
  });

  it("yields an empty window for degenerate geometry rather than guessing", () => {
    // An unmeasured viewport is the normal state during first paint (and under
    // jsdom); rendering everything there would defeat the purpose exactly when
    // it matters most.
    const unmeasured = resolveRowWindow(metrics({ viewportHeight: 0 }));
    expect(unmeasured.startIndex).toBe(0);
    expect(unmeasured.endIndex).toBe(0);
    expect(unmeasured.paddingBottom).toBe(unmeasured.totalHeight);
    expect(unmeasured.totalHeight).toBe(320_000);

    expect(resolveRowWindow(metrics({ totalRows: 0 })).totalHeight).toBe(0);
    expect(resolveRowWindow(metrics({ rowHeight: 0 })).endIndex).toBe(0);
    expect(resolveRowWindow(metrics({ rowHeight: -32 })).endIndex).toBe(0);
  });

  it("never returns a negative padding", () => {
    for (const scrollTop of [0, 1, 319_000, 400_000]) {
      const window = resolveRowWindow(metrics({ scrollTop, overscan: 50 }));
      expect(window.paddingTop).toBeGreaterThanOrEqual(0);
      expect(window.paddingBottom).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("sameRowWindow", () => {
  it("is true only while the rendered slice is unchanged", () => {
    // Scroll fires continuously; the render is needed precisely when the slice
    // changes, not on every event.
    const a = resolveRowWindow(metrics({ scrollTop: 3_200 }));
    const nudged = resolveRowWindow(metrics({ scrollTop: 3_210 }));
    const moved = resolveRowWindow(metrics({ scrollTop: 6_400 }));

    expect(sameRowWindow(a, nudged)).toBe(true);
    expect(sameRowWindow(a, moved)).toBe(false);
  });
});
