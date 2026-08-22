/** A run of text inside one line: unchanged, or part of the delta. */
export type DiffSegmentKind = "equal" | "added" | "removed";

export interface DiffSegment {
  kind: DiffSegmentKind;
  text: string;
}

/** How an aligned row of the comparison classifies. */
export type DiffRowKind = "equal" | "added" | "removed" | "changed";

export interface DiffLine {
  /** 1-based line number in its own document. */
  number: number;
  text: string;
  /** Word-level runs; present on the paired lines of a `changed` row. */
  segments?: DiffSegment[];
}

/**
 * One aligned row: `equal` and `changed` rows carry both sides, `removed`
 * only the before side, `added` only the after side. Side-by-side renders
 * the two sides in one grid row; inline mode renders removed then added.
 */
export interface DiffRow {
  kind: DiffRowKind;
  before?: DiffLine;
  after?: DiffLine;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
}

export interface DiffResult {
  rows: DiffRow[];
  stats: DiffStats;
  /**
   * Row-index ranges of consecutive non-equal rows — the navigable "changes"
   * (hunks) the viewer steps through.
   */
  changeRanges: Array<{ start: number; end: number }>;
}

/**
 * How a comparison shell maps one pane's scroll position onto the other.
 *
 * `proportional` matches by fraction of the scrollable range — the only sane
 * default when the two documents are different lengths, since the shorter one
 * would otherwise run out long before the longer one finished.
 * `absolute` keeps the same pixel offset, which is what you want for two
 * renderings of the *same* document, where line N sits at the same height in
 * both and proportional mapping would slowly drift them apart.
 */
export type CompareSyncMode = "proportional" | "absolute";

/** The three numbers a scroll calculation needs, so the maths stays DOM-free. */
export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

/** How far a pane can actually scroll. Zero when the content fits. */
export const scrollableRange = (metrics: ScrollMetrics): number =>
  Math.max(0, metrics.scrollHeight - metrics.clientHeight);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Where `target` should scroll to so it matches `source`.
 *
 * Both degenerate cases return 0 rather than `NaN`: a target that cannot
 * scroll has nowhere to go, and a source that cannot scroll carries no
 * position to map (its fraction would be 0/0).
 */
export const mapScrollPosition = (
  source: ScrollMetrics,
  target: ScrollMetrics,
  mode: CompareSyncMode = "proportional",
): number => {
  const targetRange = scrollableRange(target);
  if (targetRange === 0) {
    return 0;
  }
  if (mode === "absolute") {
    return clamp(source.scrollTop, 0, targetRange);
  }
  const sourceRange = scrollableRange(source);
  if (sourceRange === 0) {
    return 0;
  }
  return clamp((source.scrollTop / sourceRange) * targetRange, 0, targetRange);
};
