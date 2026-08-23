// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  buildOffsetIndex,
  offsetOfItem,
  resolveOffsetWindow,
} from "../../src/core/offset-window.js";
import { sameRowWindow } from "../../src/core/virtualize.js";

/** A grouped log: a short heading, then a run of taller event rows. */
const grouped = (groups: number, eventsPerGroup: number): number[] => {
  const heights: number[] = [];
  for (let group = 0; group < groups; group++) {
    heights.push(28); // heading
    for (let event = 0; event < eventsPerGroup; event++) heights.push(64);
  }
  return heights;
};

const heightOfSlice = (heights: readonly number[], start: number, end: number): number =>
  heights.slice(start, end).reduce((total, height) => total + height, 0);

describe("buildOffsetIndex", () => {
  it("accumulates running offsets with the total as the final entry", () => {
    const index = buildOffsetIndex([10, 20, 30]);
    expect(index.offsets).toEqual([0, 10, 30, 60]);
    expect(index.count).toBe(3);
    expect(index.totalHeight).toBe(60);
  });

  it("treats a bad height as zero instead of poisoning every later offset", () => {
    // One NaN from a failed measurement must not make the whole scrollbar NaN.
    const index = buildOffsetIndex([10, Number.NaN, 20, -5, Number.POSITIVE_INFINITY, 30]);
    expect(index.offsets).toEqual([0, 10, 10, 30, 30, 30, 60]);
    expect(index.totalHeight).toBe(60);
    expect(index.offsets.every(Number.isFinite)).toBe(true);
  });

  it("handles an empty list", () => {
    const index = buildOffsetIndex([]);
    expect(index).toEqual({ offsets: [0], count: 0, totalHeight: 0 });
  });
});

describe("resolveOffsetWindow", () => {
  it("renders a small slice of a large grouped collection", () => {
    const heights = grouped(200, 9); // 2,000 items, 12,800px
    const index = buildOffsetIndex(heights);
    const window = resolveOffsetWindow(index, { viewportHeight: 640, scrollTop: 0 });

    expect(window.startIndex).toBe(0);
    expect(window.endIndex - window.startIndex).toBeLessThan(30);
    expect(window.totalHeight).toBe(200 * (28 + 9 * 64));
  });

  it("keeps the scroll range constant however the window moves", () => {
    // The invariant that makes the scrollbar trustworthy — and the one the
    // fixed-height engine cannot hold for mixed heights.
    const heights = grouped(200, 9);
    const index = buildOffsetIndex(heights);

    for (const scrollTop of [0, 37, 1_000, 60_000, 118_000, index.totalHeight]) {
      const window = resolveOffsetWindow(index, { viewportHeight: 640, scrollTop });
      const rendered = heightOfSlice(heights, window.startIndex, window.endIndex);
      expect(window.paddingTop + rendered + window.paddingBottom).toBe(window.totalHeight);
    }
  });

  it("always covers the visible band", () => {
    // Overscan may add items; it must never drop one the viewport shows.
    const heights = grouped(100, 5);
    const index = buildOffsetIndex(heights);

    for (const scrollTop of [0, 100, 999, 5_000, 20_000]) {
      const window = resolveOffsetWindow(index, {
        viewportHeight: 500,
        scrollTop,
        overscan: 0,
      });
      const top = Math.min(scrollTop, index.totalHeight - 500);
      const bottom = top + 500;

      // Every item overlapping the band is inside the rendered slice.
      for (let item = 0; item < index.count; item++) {
        const itemTop = index.offsets[item]!;
        const itemBottom = index.offsets[item + 1]!;
        const visible = itemBottom > top && itemTop < bottom;
        if (visible) {
          expect(item, `item ${String(item)} at scrollTop ${String(scrollTop)}`)
            .toBeGreaterThanOrEqual(window.startIndex);
          expect(item).toBeLessThan(window.endIndex);
        }
      }
    }
  });

  it("lands on the right item when the heights are uneven", () => {
    // A short heading followed by tall rows: a fixed-height guess would put the
    // scroll position several items off. 28 + 64*3 = 220 is the second heading.
    const index = buildOffsetIndex(grouped(10, 3));
    const window = resolveOffsetWindow(index, {
      viewportHeight: 100,
      scrollTop: 220,
      overscan: 0,
    });
    expect(window.startIndex).toBe(4); // the second group's heading
    expect(window.paddingTop).toBe(220);
  });

  it("clamps a bounced or past-the-end scroll", () => {
    const heights = grouped(50, 4);
    const index = buildOffsetIndex(heights);

    const negative = resolveOffsetWindow(index, { viewportHeight: 400, scrollTop: -900 });
    expect(negative.startIndex).toBe(0);
    expect(negative.paddingTop).toBe(0);

    const past = resolveOffsetWindow(index, { viewportHeight: 400, scrollTop: 10_000_000 });
    expect(past.endIndex).toBe(index.count);
    expect(past.paddingBottom).toBe(0);
    expect(past.startIndex).toBeLessThanOrEqual(past.endIndex);
    for (const window of [negative, past]) {
      const rendered = heightOfSlice(heights, window.startIndex, window.endIndex);
      expect(window.paddingTop + rendered + window.paddingBottom).toBe(window.totalHeight);
    }

    // The assertions above all hold with the clamp removed, because the binary
    // search saturates at the last item anyway — so they do not actually test
    // it. What the clamp buys is that an over-scrolled viewport still renders a
    // viewport's *worth*: without it the window starts at the final item and
    // the reader sees blank space above it. Pin the covered band.
    expect(past.paddingTop).toBeLessThanOrEqual(index.totalHeight - 400);
    expect(heightOfSlice(heights, past.startIndex, past.endIndex)).toBeGreaterThanOrEqual(400);
  });

  it("overscan adds items on both sides of the visible band", () => {
    const heights = grouped(100, 5);
    const index = buildOffsetIndex(heights);
    const metrics = { viewportHeight: 500, scrollTop: 6_000 };

    const none = resolveOffsetWindow(index, { ...metrics, overscan: 0 });
    const wide = resolveOffsetWindow(index, { ...metrics, overscan: 6 });

    expect(wide.startIndex).toBe(none.startIndex - 6);
    expect(wide.endIndex).toBe(none.endIndex + 6);
    expect(wide.paddingTop).toBeLessThan(none.paddingTop);
    expect(wide.paddingBottom).toBeLessThan(none.paddingBottom);

    // A negative overscan is not a way to render fewer items than are visible.
    const negative = resolveOffsetWindow(index, { ...metrics, overscan: -8 });
    expect(negative.startIndex).toBe(none.startIndex);
    expect(negative.endIndex).toBe(none.endIndex);
  });

  it("renders everything when the collection fits the viewport", () => {
    const index = buildOffsetIndex([28, 64, 64]);
    const window = resolveOffsetWindow(index, { viewportHeight: 640, scrollTop: 0 });
    expect(window).toEqual({
      startIndex: 0,
      endIndex: 3,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 156,
    });
  });

  it("does not skip a zero-height item sitting above the first visible one", () => {
    // Collapsed-to-nothing items share an offset with their neighbour. Ties
    // must resolve to the first of the run, or the item above the window edge
    // silently never renders.
    const index = buildOffsetIndex([100, 0, 0, 100, 100]);
    const window = resolveOffsetWindow(index, {
      viewportHeight: 100,
      scrollTop: 100,
      overscan: 0,
    });
    expect(window.startIndex).toBe(1);
    expect(window.paddingTop).toBe(100);
  });

  it("yields an empty window for degenerate geometry rather than guessing", () => {
    const index = buildOffsetIndex(grouped(20, 3));

    const unmeasured = resolveOffsetWindow(index, { viewportHeight: 0, scrollTop: 0 });
    expect(unmeasured.startIndex).toBe(0);
    expect(unmeasured.endIndex).toBe(0);
    expect(unmeasured.paddingBottom).toBe(unmeasured.totalHeight);

    const empty = resolveOffsetWindow(buildOffsetIndex([]), {
      viewportHeight: 640,
      scrollTop: 0,
    });
    expect(empty.endIndex).toBe(0);
    expect(empty.totalHeight).toBe(0);

    const weightless = resolveOffsetWindow(buildOffsetIndex([0, 0, 0]), {
      viewportHeight: 640,
      scrollTop: 0,
    });
    expect(weightless.endIndex).toBe(0);
  });

  it("never returns a negative padding", () => {
    const index = buildOffsetIndex(grouped(30, 6));
    for (const scrollTop of [0, 1, index.totalHeight - 1, index.totalHeight * 2]) {
      const window = resolveOffsetWindow(index, {
        viewportHeight: 500,
        scrollTop,
        overscan: 50,
      });
      expect(window.paddingTop).toBeGreaterThanOrEqual(0);
      expect(window.paddingBottom).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces a window comparable with sameRowWindow, so renders can be skipped", () => {
    const index = buildOffsetIndex(grouped(100, 5));
    const a = resolveOffsetWindow(index, { viewportHeight: 500, scrollTop: 3_000 });
    const nudged = resolveOffsetWindow(index, { viewportHeight: 500, scrollTop: 3_002 });
    const moved = resolveOffsetWindow(index, { viewportHeight: 500, scrollTop: 9_000 });

    expect(sameRowWindow(a, nudged)).toBe(true);
    expect(sameRowWindow(a, moved)).toBe(false);
  });

  it("agrees with the fixed-height engine when every item is the same height", () => {
    // Not a redundant test: the two engines are interchangeable by contract, so
    // where their domains overlap they must not disagree.
    const index = buildOffsetIndex(Array.from({ length: 1_000 }, () => 32));
    for (const scrollTop of [0, 320, 3_200, 31_360]) {
      const offsetWindow = resolveOffsetWindow(index, { viewportHeight: 640, scrollTop });
      expect(offsetWindow.totalHeight).toBe(32_000);
      expect(offsetWindow.paddingTop).toBe(offsetWindow.startIndex * 32);
      expect(offsetWindow.paddingBottom).toBe(32_000 - offsetWindow.endIndex * 32);
    }
  });
});

describe("offsetOfItem", () => {
  it("returns an item's top, clamping out-of-range indices", () => {
    const index = buildOffsetIndex([28, 64, 64]);
    expect(offsetOfItem(index, 0)).toBe(0);
    expect(offsetOfItem(index, 2)).toBe(92);
    expect(offsetOfItem(index, -5)).toBe(0);
    expect(offsetOfItem(index, 99)).toBe(156);
    expect(offsetOfItem(buildOffsetIndex([]), 3)).toBe(0);
  });
});
