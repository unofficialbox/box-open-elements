/**
 * Row windowing for lists whose rows are *not* all the same height.
 *
 * `resolveRowWindow` (./virtualize.ts) multiplies a row count by one row
 * height. That is exact and O(1), and it is the right answer for a flat table
 * of uniform rows — but it cannot describe a surface where the items differ:
 * a grouped audit log alternates short headings with taller event rows, a
 * collapsed group contributes only its heading, and an expanded detail row adds
 * height the count knows nothing about. Feeding those to the fixed-height
 * engine does not degrade gracefully; the spacers under-report the real height,
 * the scroll range stops matching the scrollbar, and `scrollTop` maps to the
 * wrong item. That is why `box-table` refuses to window expandable rows rather
 * than approximating them.
 *
 * The general answer is a cumulative offset index: the running pixel offset of
 * every item, built once, then binary-searched per scroll. Building is O(n) and
 * searching is O(log n), which is the right split — heights change when the
 * data or the collapse state changes, not on every scroll event.
 *
 * Heights are still *estimates* until something measures them. This engine
 * takes whatever heights it is given and is exact with respect to them; keeping
 * them honest is the caller's job, the same bargain `row-height` strikes.
 */

import type { RowWindow } from "./virtualize.js";

const DEFAULT_OVERSCAN = 4;

export interface OffsetIndex {
  /**
   * Running offsets, length `count + 1`. `offsets[i]` is the top of item `i`;
   * `offsets[count]` is the total height, so the height of item `i` is
   * `offsets[i + 1] - offsets[i]` with no special case for the last one.
   */
  readonly offsets: readonly number[];
  readonly count: number;
  readonly totalHeight: number;
}

export interface OffsetWindowMetrics {
  /** Height of the scrolling viewport, in pixels. */
  viewportHeight: number;
  /** Current scroll offset of the viewport, in pixels. */
  scrollTop: number;
  /** Extra items rendered above and below the visible band. Default 4. */
  overscan?: number;
}

const EMPTY_INDEX: OffsetIndex = { offsets: [0], count: 0, totalHeight: 0 };

/**
 * The cumulative offset index for a list of item heights.
 *
 * A non-finite or negative height contributes zero rather than poisoning every
 * subsequent offset with `NaN`. Heights arrive from measurement and from host
 * estimates; one bad value should cost that item its space, not break the
 * scrollbar for the whole collection.
 */
export const buildOffsetIndex = (heights: readonly number[]): OffsetIndex => {
  if (heights.length === 0) return EMPTY_INDEX;

  const offsets = new Array<number>(heights.length + 1);
  offsets[0] = 0;
  let running = 0;
  for (let index = 0; index < heights.length; index++) {
    const height = heights[index] ?? 0;
    running += Number.isFinite(height) && height > 0 ? height : 0;
    offsets[index + 1] = running;
  }

  return { offsets, count: heights.length, totalHeight: running };
};

/**
 * The index of the last item whose top is at or before `offset`.
 *
 * Binary search rather than a scan: this runs per scroll frame, and a linear
 * walk over ten thousand offsets is the cost windowing exists to avoid.
 * Zero-height items make offsets non-strictly-increasing, so ties resolve to
 * the *first* of a run — the alternative is a window that starts inside a
 * cluster of collapsed items and leaves the one above it unrendered.
 */
const findItemAt = (offsets: readonly number[], count: number, offset: number): number => {
  let low = 0;
  let high = count - 1;
  let found = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if ((offsets[mid] ?? 0) <= offset) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  // Walk back over a run of equal offsets (zero-height items) so the window
  // starts at the first item sharing this offset, not an arbitrary one.
  const at = offsets[found] ?? 0;
  while (found > 0 && (offsets[found - 1] ?? 0) === at) found--;
  return found;
};

/**
 * The rendered slice for a scroll position, plus the spacer heights.
 *
 * Same contract as `resolveRowWindow`, so the two engines are interchangeable
 * from a component's point of view:
 * - `paddingTop + (height of the rendered items) + paddingBottom` always equals
 *   `totalHeight`, so the scroll range never drifts as items scroll by.
 * - The window always covers the visible band; overscan only ever adds items.
 * - Degenerate geometry yields an empty window rather than a guess.
 */
export const resolveOffsetWindow = (
  index: OffsetIndex,
  metrics: OffsetWindowMetrics,
): RowWindow => {
  const { offsets, count, totalHeight } = index;
  const overscan = Math.max(0, Math.floor(metrics.overscan ?? DEFAULT_OVERSCAN));

  if (count <= 0 || totalHeight <= 0) {
    return { startIndex: 0, endIndex: 0, paddingTop: 0, paddingBottom: 0, totalHeight };
  }

  if (metrics.viewportHeight <= 0) {
    // An unmeasured viewport is the normal state during first paint and under
    // jsdom. Rendering everything there would defeat the purpose exactly when
    // it matters most.
    return { startIndex: 0, endIndex: 0, paddingTop: 0, paddingBottom: totalHeight, totalHeight };
  }

  // Clamp a bounced or past-the-end scrollTop: rubber-banding reports both, and
  // neither may produce a window outside the collection.
  const maxScroll = Math.max(0, totalHeight - metrics.viewportHeight);
  const top = Math.min(Math.max(0, metrics.scrollTop), maxScroll);
  const bottom = top + metrics.viewportHeight;

  const firstVisible = findItemAt(offsets, count, top);

  // Last item that starts before the viewport's bottom edge. Scanning forward
  // from firstVisible is bounded by what fits on screen plus overscan, which is
  // the point of windowing — no walk over the whole collection.
  let lastVisible = firstVisible;
  while (lastVisible + 1 < count && (offsets[lastVisible + 1] ?? 0) < bottom) {
    lastVisible++;
  }

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(count, lastVisible + 1 + overscan);

  return {
    startIndex,
    endIndex,
    paddingTop: offsets[startIndex] ?? 0,
    paddingBottom: totalHeight - (offsets[endIndex] ?? totalHeight),
    totalHeight,
  };
};

/**
 * The pixel offset of an item, for scrolling it into view.
 *
 * Out-of-range indices clamp to the ends rather than returning `undefined`:
 * callers are keyboard handlers reaching for "the last one", and a clamp is
 * what they would write anyway.
 */
export const offsetOfItem = (index: OffsetIndex, item: number): number => {
  if (index.count <= 0) return 0;
  const clamped = Math.min(Math.max(0, Math.floor(item)), index.count);
  return index.offsets[clamped] ?? 0;
};
