/**
 * Windowing plan for the grouped audit log.
 *
 * `box-table` can refuse to window expandable rows because a flat table has an
 * alternative: render everything. A ten-thousand-event audit log does not —
 * grouping is the whole point of the surface, and grouped rows are exactly what
 * fixed-height windowing cannot describe. So this is the case that needs the
 * cumulative-offset engine (`src/core/offset-window.ts`) rather than an excuse.
 *
 * The log is windowed as one flat sequence of rows — each group contributes a
 * heading row, then one row per event while it is expanded — because a single
 * day's section can hold thousands of events on its own. Windowing whole groups
 * would leave that case exactly as slow as it is now.
 *
 * The rendered DOM is still nested, so the flat window has to be turned back
 * into sections. That is what `planAuditWindow` does, and the reason it exists
 * as a pure function is the usual one: jsdom has no layout, so a DOM-level test
 * of a windowed surface can only ever observe zeroes.
 *
 * ## The straddling group
 *
 * A group whose heading has scrolled above the viewport still needs its heading
 * rendered: `[part="group-body"]` is `aria-labelledby` its toggle, and a
 * section that arrives without its own heading is both unlabelled and
 * impossible to collapse. So an intersecting group always renders its heading —
 * which means rendering one heading the offset index has already accounted for
 * in `paddingTop`.
 *
 * At most one group can straddle the top edge, so that is a single correction:
 * take the heading's height back out of the top spacer. The events below then
 * land where the scrollbar says they should, and the reclaimed heading sits
 * directly above them.
 */

import { buildOffsetIndex, resolveOffsetWindow } from "../../core/offset-window.js";
import type { OffsetIndex } from "../../core/offset-window.js";
import type { RowWindow } from "../../core/virtualize.js";
import type { AuditGroup } from "./types.js";

/** One row of the flattened log: a section heading, or an event inside one. */
export interface AuditRow {
  kind: "heading" | "event";
  /** Index into the groups array. */
  groupIndex: number;
  /** Index within that group's events; absent on a heading row. */
  eventIndex?: number;
}

export interface AuditRowHeights {
  heading: number;
  event: number;
}

/** What to render for one group intersecting the window. */
export interface PlannedGroup {
  groupIndex: number;
  /** First event of this group to render, inclusive. */
  eventStart: number;
  /** Last event of this group to render, exclusive. */
  eventEnd: number;
  /**
   * True when this group's own heading row is inside the window. False means
   * the heading scrolled above the viewport and is being rendered anyway —
   * `paddingTop` has already been corrected for it.
   */
  headingInWindow: boolean;
}

export interface AuditWindowPlan {
  groups: PlannedGroup[];
  paddingTop: number;
  paddingBottom: number;
  totalHeight: number;
  /** The underlying row window, for cheap "did the slice change?" comparisons. */
  window: RowWindow;
}

/**
 * The log as a flat row sequence. A collapsed group contributes its heading
 * only — which is exactly why the heights vary and the fixed-height engine
 * cannot describe this surface.
 */
export const flattenAuditRows = (
  groups: readonly AuditGroup[],
  collapsedKeys: ReadonlySet<string>,
): AuditRow[] => {
  const rows: AuditRow[] = [];
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex]!;
    rows.push({ kind: "heading", groupIndex });
    if (collapsedKeys.has(group.key)) continue;
    for (let eventIndex = 0; eventIndex < group.events.length; eventIndex++) {
      rows.push({ kind: "event", groupIndex, eventIndex });
    }
  }
  return rows;
};

export const auditRowHeights = (
  rows: readonly AuditRow[],
  heights: AuditRowHeights,
): number[] => rows.map(row => (row.kind === "heading" ? heights.heading : heights.event));

/**
 * The scroll offset to plan at, given where the scroller actually is.
 *
 * Without a measured `contentHeight` this is the raw offset. With one, it is
 * the same *fraction* of the estimated range as the reader is through the real
 * one — which is what makes the two ends agree.
 */
const mapScrollToEstimate = (
  viewport: { viewportHeight: number; scrollTop: number; contentHeight?: number },
  totalHeight: number,
): number => {
  const { contentHeight, scrollTop, viewportHeight } = viewport;
  if (contentHeight === undefined || !Number.isFinite(contentHeight)) return scrollTop;

  const realRange = contentHeight - viewportHeight;
  const estimatedRange = totalHeight - viewportHeight;
  // Nothing scrolls, or the estimate already agrees closely enough that the
  // mapping would only add rounding noise.
  if (realRange <= 0 || estimatedRange <= 0) return scrollTop;

  const fraction = Math.min(Math.max(0, scrollTop / realRange), 1);
  return fraction * estimatedRange;
};

/**
 * Which sections to render, and the spacer heights around them.
 *
 * Returns an empty plan for an empty window rather than a plan with no groups
 * and stale padding, so a caller can treat "nothing to render" uniformly.
 */
/**
 * The offset index for a row set, so a caller can build it once and reuse it
 * across scroll frames. The index only changes when the rows or the heights do.
 */
export const buildAuditIndex = (
  rows: readonly AuditRow[],
  heights: AuditRowHeights,
): OffsetIndex => buildOffsetIndex(auditRowHeights(rows, heights));

export const planAuditWindow = (
  rows: readonly AuditRow[],
  heights: AuditRowHeights,
  viewport: {
    viewportHeight: number;
    scrollTop: number;
    overscan?: number;
    /**
     * The scroller's real `scrollHeight`, when the caller can measure it.
     *
     * Two heights per row kind is an estimate, and over thousands of rows the
     * estimate and the rendered reality drift apart — measured at ~0.9% on a
     * 2,000-event log, which sounds harmless and is not: if the estimate runs
     * *long*, scrolling to the real bottom leaves the plan believing there is
     * still a screenful below, and the last rows can never be reached. Content
     * you cannot scroll to is worse than a slightly wrong scrollbar.
     *
     * Given the real height, the scroll position is read as a fraction of the
     * real range and applied to the estimated one, so both ends line up: at the
     * bottom of the scroller the plan is at the bottom of the log.
     */
    contentHeight?: number;
  },
  /**
   * A prebuilt index for these rows and heights, from `buildAuditIndex`.
   *
   * Optional purely for callers that plan once. The scroll path should pass one:
   * building the index is O(n), and rebuilding it per frame would put the O(n)
   * back that the binary search exists to remove.
   */
  prebuilt?: OffsetIndex,
): AuditWindowPlan => {
  const index = prebuilt ?? buildAuditIndex(rows, heights);

  const window = resolveOffsetWindow(index, {
    ...viewport,
    scrollTop: mapScrollToEstimate(viewport, index.totalHeight),
  });

  const plan: AuditWindowPlan = {
    groups: [],
    paddingTop: window.paddingTop,
    paddingBottom: window.paddingBottom,
    totalHeight: window.totalHeight,
    window,
  };

  if (window.endIndex <= window.startIndex) return plan;

  let current: PlannedGroup | null = null;
  for (let rowIndex = window.startIndex; rowIndex < window.endIndex; rowIndex++) {
    const row = rows[rowIndex]!;
    if (!current || current.groupIndex !== row.groupIndex) {
      current = {
        groupIndex: row.groupIndex,
        eventStart: row.kind === "event" ? row.eventIndex! : 0,
        eventEnd: row.kind === "event" ? row.eventIndex! : 0,
        headingInWindow: row.kind === "heading",
      };
      plan.groups.push(current);
    }
    if (row.kind === "event") {
      current.eventEnd = row.eventIndex! + 1;
    }
  }

  // The straddling group: its heading is above the window but will be rendered,
  // so give its height back from the top spacer. Only the first planned group
  // can be in this position — every later one starts at its own heading.
  const first = plan.groups[0];
  if (first && !first.headingInWindow) {
    plan.paddingTop = Math.max(0, plan.paddingTop - heights.heading);
  }

  return plan;
};
