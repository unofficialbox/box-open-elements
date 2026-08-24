/**
 * Adobe Spectrum's responsive grid, as a foundation.
 *
 * Two surfaces build on this: `box-grid`, which lays out slotted content, and
 * `box-skeleton`'s grid variant, which fills the same regions with shimmer
 * bars. They must agree on what a column is worth and how wide a gutter is at
 * a given viewport, so the model lives here rather than in either of them.
 */

/**
 * Columns in the grid.
 *
 * Twelve divides by 2, 3, 4 and 6, so halves, thirds, quarters and
 * sidebar-plus-content all land on whole columns.
 */
export const BOE_GRID_COLUMNS = 12;

/**
 * Spectrum's breakpoints and their gutters.
 *
 * Breakpoints are min-widths, so a viewport between two of them inherits the
 * smaller one's dimensions. Gutters are fixed values per breakpoint rather
 * than a proportion of the grid — that is Spectrum's rule, and it is why the
 * gutter cannot simply be a percentage.
 */
export const BOE_GRID_BREAKPOINTS: readonly { minWidth: number; gutter: number }[] = [
  { minWidth: 0, gutter: 16 },
  { minWidth: 768, gutter: 24 },
  { minWidth: 1280, gutter: 32 },
  { minWidth: 1768, gutter: 40 },
  { minWidth: 2160, gutter: 48 },
];

/** The custom property every grid surface reads its gutter from. */
export const BOE_GRID_GUTTER_PROPERTY = "--boe-grid-gutter";

/**
 * The gutter scale as CSS, scoped to a selector.
 *
 * Emitted rather than hand-written in each component so the two cannot drift,
 * and so adding a breakpoint is one edit. A consumer overriding the property
 * replaces the whole scale in one declaration.
 */
export const boeGridGutterStyles = (selector = ":host"): string =>
  BOE_GRID_BREAKPOINTS.map(({ minWidth, gutter }) => {
    const declaration = `${selector} {\n    ${BOE_GRID_GUTTER_PROPERTY}: ${gutter}px;\n  }`;
    return minWidth === 0
      ? `  ${declaration}`
      : `  @media (min-width: ${minWidth}px) {\n  ${declaration}\n  }`;
  }).join("\n\n");

/**
 * One region of the grid: a block spanning some columns and rows, optionally
 * pushed right by an offset. Spectrum calls these layout regions.
 */
export interface BoeGridPlacement {
  /** Columns to span. Clamped to what is left after `offset`. */
  span?: number;
  /** Rows to span. Clamped to the grid's `rows`, so a region cannot exceed it. */
  rowSpan?: number;
  /** Empty columns before this region. Clamped to leave room for one column. */
  offset?: number;
}

/** A resolved region: every field present, every value in range. */
export interface ResolvedBoeGridPlacement {
  span: number;
  rowSpan: number;
  offset: number;
}

/** Attribute payloads are author input — validate every record. */
export const isBoeGridPlacementRecord = (value: unknown): value is BoeGridPlacement => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const item = value as Record<string, unknown>;
  // Absent is fine — each field has a default. Present-but-not-a-number is not:
  // it means the host built the payload wrong, and silently substituting a
  // default would hide that.
  return (["span", "rowSpan", "offset"] as const).every(key => {
    const raw = item[key];
    return raw === undefined || (typeof raw === "number" && Number.isFinite(raw));
  });
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Math.trunc(value), min), max);

/**
 * Fit a region to the grid.
 *
 * Every value is clamped rather than rejected. A layout that renders slightly
 * wrong is recoverable; one that vanishes because a number was out of range is
 * not, and the caller usually cannot tell which region was dropped. The clamps
 * are what confine a region to the totals the author declared: a span of 9 in a
 * three-column grid becomes 3, and a `rowSpan` of 5 in a three-row grid
 * becomes 3.
 */
export const resolveBoeGridPlacement = (
  item: BoeGridPlacement,
  columns: number,
  rows: number,
): ResolvedBoeGridPlacement => {
  // Leave at least one column for the region itself.
  const offset = clamp(item.offset ?? 0, 0, Math.max(columns - 1, 0));
  return {
    offset,
    span: clamp(item.span ?? 1, 1, Math.max(columns - offset, 1)),
    rowSpan: clamp(item.rowSpan ?? 1, 1, Math.max(rows, 1)),
  };
};

/** Parse a positive integer attribute, falling back when it is absent or junk. */
export const resolveGridCount = (raw: string | null, fallback: number): number => {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) ? Math.max(parsed, 1) : fallback;
};
