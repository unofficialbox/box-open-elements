/**
 * Row windowing for long lists.
 *
 * A ten-thousand-row audit log rendered whole is ten thousand DOM rows: the
 * first paint stalls, every subsequent patch walks the lot, and the browser
 * holds layout boxes nobody will ever scroll to. Windowing renders only the
 * rows near the viewport and pads the rest with spacer height, so the scrollbar
 * still describes the whole collection.
 *
 * The arithmetic lives here, pure, for the usual reason: jsdom has no layout,
 * so a DOM-level test of a windowed surface can only ever observe zeroes. It is
 * shared rather than per-component so `box-table`, `box-audit-log`, and
 * `box-tree-grid` cannot drift into three different definitions of "near".
 *
 * Fixed row height only. Measured/variable heights are a different algorithm
 * (a cumulative offset index that reflows as rows are measured); pretending one
 * function covers both is how windowing engines end up subtly wrong at the
 * boundaries.
 */

export interface WindowMetrics {
  /** Total rows in the collection, not the rendered subset. */
  totalRows: number;
  /** Fixed height of one row, in pixels. */
  rowHeight: number;
  /** Height of the scrolling viewport, in pixels. */
  viewportHeight: number;
  /** Current scroll offset of the viewport, in pixels. */
  scrollTop: number;
  /**
   * Extra rows rendered above and below the visible band, so a fast scroll
   * does not expose blank space before the next frame. Default 4.
   */
  overscan?: number;
}

export interface RowWindow {
  /** First rendered row index, inclusive. */
  startIndex: number;
  /** Last rendered row index, exclusive — safe for `slice(startIndex, endIndex)`. */
  endIndex: number;
  /** Spacer height above the rendered rows, in pixels. */
  paddingTop: number;
  /** Spacer height below the rendered rows, in pixels. */
  paddingBottom: number;
  /** Height of the whole collection, for the scroll range. */
  totalHeight: number;
}

const DEFAULT_OVERSCAN = 4;

/**
 * The rendered slice for a scroll position, plus the spacer heights that keep
 * the scrollbar honest.
 *
 * Guarantees callers can rely on:
 * - `paddingTop + (endIndex - startIndex) * rowHeight + paddingBottom` always
 *   equals `totalHeight`, so the scroll range never drifts as rows scroll by —
 *   a windowed list whose height wobbles makes the scrollbar jump under the
 *   pointer.
 * - The window always covers the visible band; overscan only ever adds rows.
 * - Degenerate geometry (no rows, unmeasured viewport, non-positive row height)
 *   yields an empty window rather than a guess. An unmeasured viewport is the
 *   normal state during first paint and under jsdom, and rendering *everything*
 *   there would defeat the purpose at exactly the moment it matters most.
 */
export const resolveRowWindow = (metrics: WindowMetrics): RowWindow => {
  const { totalRows, rowHeight, viewportHeight, scrollTop } = metrics;
  const overscan = Math.max(0, Math.floor(metrics.overscan ?? DEFAULT_OVERSCAN));

  if (totalRows <= 0 || rowHeight <= 0) {
    return { startIndex: 0, endIndex: 0, paddingTop: 0, paddingBottom: 0, totalHeight: 0 };
  }

  const totalHeight = totalRows * rowHeight;

  if (viewportHeight <= 0) {
    return { startIndex: 0, endIndex: 0, paddingTop: 0, paddingBottom: totalHeight, totalHeight };
  }

  // Clamp the scroll offset: a bounced/rubber-banded scrollTop (negative, or
  // past the end) must not produce a window outside the collection.
  const maxScroll = Math.max(0, totalHeight - viewportHeight);
  const offset = Math.min(Math.max(0, scrollTop), maxScroll);

  const firstVisible = Math.floor(offset / rowHeight);
  // ceil of the band, +1 for the row straddling the bottom edge.
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + 1;

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(totalRows, firstVisible + visibleCount + overscan);

  const paddingTop = startIndex * rowHeight;
  const paddingBottom = totalHeight - endIndex * rowHeight;

  return { startIndex, endIndex, paddingTop, paddingBottom, totalHeight };
};

/**
 * Whether a scroll moved far enough to need a re-render.
 *
 * Scroll fires continuously; re-rendering on every event would rebuild the row
 * markup dozens of times per second to show the same rows. Comparing the
 * resolved window is cheaper and exact — the render is needed precisely when
 * the slice changes.
 */
export const sameRowWindow = (a: RowWindow, b: RowWindow): boolean =>
  a.startIndex === b.startIndex && a.endIndex === b.endIndex;
