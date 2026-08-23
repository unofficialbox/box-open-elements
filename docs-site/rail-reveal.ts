/**
 * Where the rail should scroll so the current page's entry is visible.
 *
 * Pure, because the browser is the only place this geometry exists: jsdom
 * reports every layout box as zero, so a DOM-level test could only assert that
 * nothing moved. Keeping the decision here means the rule — when to scroll,
 * and how far — is testable on its own.
 */
export interface RailRevealGeometry {
  /** Entry offset from the top of the rail's scrollable content. */
  itemTop: number;
  itemHeight: number;
  /** Current scroll offset of the rail. */
  viewTop: number;
  /** Visible height of the rail. */
  viewHeight: number;
  /** Total scrollable content height, for clamping. */
  scrollHeight: number;
}

/**
 * Returns the scroll offset to apply, or `null` to leave the rail alone.
 *
 * Null when the entry is already fully visible — the restored scroll position
 * is deliberate, and yanking it for an entry the reader can already see would
 * undo their own scrolling. When a scroll is needed the entry is centred rather
 * than nudged flush to an edge, so it lands with its neighbours for context,
 * clamped to the real scroll range so the last group cannot leave empty space
 * below the list.
 *
 * A zero-height viewport (an unlaid-out or hidden rail) yields null: there is
 * no "in view" to reason about, and scrolling blind would be a guess.
 */
export const resolveRailReveal = (geometry: RailRevealGeometry): number | null => {
  const { itemTop, itemHeight, viewTop, viewHeight, scrollHeight } = geometry;
  if (viewHeight <= 0) {
    return null;
  }

  const itemBottom = itemTop + itemHeight;
  const viewBottom = viewTop + viewHeight;
  if (itemTop >= viewTop && itemBottom <= viewBottom) {
    return null;
  }

  // Centring an entry taller than the viewport would push its top off-screen,
  // so such an entry aligns to its top instead — you read a list entry from its
  // first line. Rail entries are single-line today; the engine should not
  // depend on that staying true.
  const target = itemHeight >= viewHeight ? itemTop : itemTop - (viewHeight - itemHeight) / 2;
  const maxScroll = Math.max(0, scrollHeight - viewHeight);
  return Math.round(Math.min(Math.max(0, target), maxScroll));
};
