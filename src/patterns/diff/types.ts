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
