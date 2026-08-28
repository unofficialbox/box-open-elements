import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import {
  BOE_GRID_COLUMNS,
  BOE_GRID_GUTTER_PROPERTY,
  boeGridGutterStyles,
  isBoeGridPlacementRecord,
  resolveBoeGridPlacement,
  resolveGridCount,
} from "../../foundations/layout/index.js";
import type { BoeGridPlacement, ResolvedBoeGridPlacement } from "../../foundations/layout/index.js";
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
} from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-skeleton";

/**
 * Shape of the placeholder.
 *
 * `box` is a single rectangle sized by `width`/`height` — the original
 * behaviour, and still the default. `line` is a stack of text lines. `grid` is
 * a column layout whose regions stand in for cards, tiles or panels.
 */
export type SkeletonVariant = "box" | "line" | "grid";

const SKELETON_VARIANTS = new Set<SkeletonVariant>(["box", "line", "grid"]);

/**
 * Narrow an author-supplied variant, falling back to `box`.
 *
 * A typo should render the original single rectangle rather than an empty
 * element: every multi-part branch is scoped to a known value.
 */
export const resolveSkeletonVariant = (value: string | null | undefined): SkeletonVariant =>
  SKELETON_VARIANTS.has(value as SkeletonVariant) ? (value as SkeletonVariant) : "box";

/**
 * The columns in Adobe Spectrum's responsive grid.
 *
 * Delegated to the layout foundation that `box-grid` also builds on: a
 * skeleton stands in for a real layout, so if the two disagreed about what a
 * column is worth the placeholder would stop matching what replaces it.
 */
export const SKELETON_DEFAULT_COLUMNS = BOE_GRID_COLUMNS;

/** One region of the grid, in Spectrum's terms. */
export type SkeletonGridItem = BoeGridPlacement;

/** A resolved region: every field present, every value in range. */
export type ResolvedSkeletonGridItem = ResolvedBoeGridPlacement;

/** Attribute payloads are author input — validate every record. */
export const isSkeletonGridItemRecord = isBoeGridPlacementRecord;

/**
 * Fit a region to the grid, clamping every value to the declared totals.
 *
 * Still exported here because it is part of this component's published
 * surface; the behaviour now lives in the foundation.
 */
export const resolveSkeletonGridItem = resolveBoeGridPlacement;

const skeletonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;

  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

${boeGridGutterStyles(":host")}

  /* The multi-part variants are layout, so they take the full width they are
     given rather than shrink-wrapping like the single box. */
  :host([variant="line"]),
  :host([variant="grid"]) {
    display: block;
  }

  [part="skeleton"] {
    border-radius: ${boeRadius.med};
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 50%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 100%
      );
    background-size: 200% 100%;
    animation: boe-skeleton-shimmer ${boeMotionDuration.shimmer} ${boeMotionEasing.standard} infinite;
  }

  [part="lines"] {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  [part="lines"] [part="skeleton"] {
    display: block;
    inline-size: 100%;
  }

  /* The last line stops short, the way a paragraph's does. Without it a stack
     of equal bars reads as a table rather than as text. */
  [part="lines"] [part="skeleton"]:last-child:not(:only-child) {
    inline-size: 62%;
  }

  [part="grid"] {
    display: grid;
    grid-template-columns: repeat(var(--boe-skeleton-columns, ${BOE_GRID_COLUMNS}), minmax(0, 1fr));
    grid-auto-rows: var(--boe-skeleton-row-height, 48px);
    gap: var(${BOE_GRID_GUTTER_PROPERTY});
  }

  /* Offsets are spacers rather than an explicit grid-column-start, so they
     compose with auto-placement instead of fighting it: an explicit start makes
     the item hunt for a row where that exact column is free, which reorders the
     regions the author listed. */
  [part="grid-offset"] {
    visibility: hidden;
  }

  @keyframes boe-skeleton-shimmer {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -100% 0;
    }
  }

  ${boeReducedMotionStyles('[part="skeleton"]', "animation: none;")}
`;

export class Skeleton extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["columns", "height", "items", "lines", "row-height", "rows", "variant", "width"];
  }

  private skeletonEl!: HTMLElement;
  private rootEl!: HTMLElement;
  private appliedWidth = "";
  private appliedHeight = "";
  private renderedVariant: SkeletonVariant | null = null;
  private itemsRaw: string | null = null;
  private itemsCache: SkeletonGridItem[] = [];

  get width(): string {
    return this.getAttribute("width") ?? "100%";
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return this.getAttribute("height") ?? "16px";
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  /** Shape of the placeholder. An unknown value falls back to `box`. */
  get variant(): SkeletonVariant {
    return resolveSkeletonVariant(this.getAttribute("variant"));
  }

  set variant(value: SkeletonVariant) {
    this.setAttribute("variant", value);
  }

  /** Lines drawn by the `line` variant. Values below 1 render a single line. */
  get lines(): number {
    const parsed = Number.parseInt(this.getAttribute("lines") ?? "", 10);
    return Number.isFinite(parsed) ? Math.max(parsed, 1) : 3;
  }

  set lines(value: number) {
    this.setAttribute("lines", String(value));
  }

  /** Columns in the `grid` variant. Defaults to Spectrum's twelve. */
  get columns(): number {
    return resolveGridCount(this.getAttribute("columns"), BOE_GRID_COLUMNS);
  }

  set columns(value: number) {
    this.setAttribute("columns", String(value));
  }

  /** Rows in the `grid` variant. Also the ceiling for any region's `rowSpan`. */
  get rows(): number {
    return resolveGridCount(this.getAttribute("rows"), 1);
  }

  set rows(value: number) {
    this.setAttribute("rows", String(value));
  }

  /** Height of one grid row; a region spanning two is twice this plus a gutter. */
  get rowHeight(): string {
    return this.getAttribute("row-height") ?? "48px";
  }

  set rowHeight(value: string) {
    this.setAttribute("row-height", value);
  }

  /**
   * Regions of the `grid` variant, in order.
   *
   * With none given the grid is filled with single-column regions — `rows` ×
   * `columns` of them — so `rows` and `columns` alone describe a uniform grid.
   */
  get items(): SkeletonGridItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }
    if (raw !== this.itemsRaw) {
      this.itemsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.itemsCache =
          Array.isArray(parsed) && parsed.every(isSkeletonGridItemRecord)
            ? (parsed as SkeletonGridItem[])
            : [];
      } catch {
        this.itemsCache = [];
      }
    }
    return [...this.itemsCache];
  }

  set items(value: SkeletonGridItem[]) {
    if (value.length) {
      this.setAttribute("items", JSON.stringify(value));
      return;
    }
    this.removeAttribute("items");
  }

  /** The grid's regions as rendered: clamped to `columns` and `rows`. */
  get resolvedItems(): ResolvedSkeletonGridItem[] {
    const columns = this.columns;
    const rows = this.rows;
    const declared = this.items;
    const source: SkeletonGridItem[] = declared.length
      ? declared
      : Array.from({ length: rows * columns }, () => ({}));
    return source.map(item => resolveSkeletonGridItem(item, columns, rows));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${skeletonStyles}</style>
      <span part="skeleton" style="display:inline-block;" aria-hidden="true"></span>
    `;
    this.skeletonEl = this.shadowRoot.querySelector('[part="skeleton"]')!;
    this.appliedWidth = "";
    this.appliedHeight = "";
    this.renderedVariant = "box";
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const variant = this.variant;
    if (variant !== "box") {
      this.updateGroup(variant);
      return;
    }

    if (this.renderedVariant !== "box") {
      // Coming back from a multi-part variant: restore the single box that the
      // width/height path writes into.
      this.shadowRoot.innerHTML = `
        <style>${skeletonStyles}</style>
        <span part="skeleton" style="display:inline-block;" aria-hidden="true"></span>
      `;
      this.skeletonEl = this.shadowRoot.querySelector('[part="skeleton"]')!;
      this.appliedWidth = "";
      this.appliedHeight = "";
      this.renderedVariant = "box";
    }

    if (!this.skeletonEl) {
      return;
    }

    // Apply size via the CSSOM, not string interpolation: setProperty validates
    // the value and silently drops anything invalid, so attribute-supplied
    // width/height can't break out of the style attribute and inject markup.
    // Skip per-dimension when unchanged to avoid redundant CSSOM writes.
    const nextWidth = this.width;
    const nextHeight = this.height;
    if (nextWidth !== this.appliedWidth) {
      this.skeletonEl.style.setProperty("width", nextWidth);
      this.appliedWidth = nextWidth;
    }
    if (nextHeight !== this.appliedHeight) {
      this.skeletonEl.style.setProperty("height", nextHeight);
      this.appliedHeight = nextHeight;
    }
  }

  /** Render the `line` or `grid` variant, which draw many bars rather than one. */
  private updateGroup(variant: Exclude<SkeletonVariant, "box">): void {
    const shadowRoot = this.shadowRoot!;
    if (this.renderedVariant !== variant) {
      shadowRoot.innerHTML = `
        <style>${skeletonStyles}</style>
        <div part="${variant === "line" ? "lines" : "grid"}" aria-hidden="true"></div>
      `;
      this.rootEl = shadowRoot.querySelector(`[part="${variant === "line" ? "lines" : "grid"}"]`)!;
      this.renderedVariant = variant;
      this.appliedWidth = "";
      this.appliedHeight = "";
    }

    if (variant === "line") {
      this.renderLines();
      return;
    }
    this.renderGrid();
  }

  private renderLines(): void {
    const count = this.lines;
    const height = this.height;

    // Reuse the bars already there: only the count changes between renders, and
    // replacing every node would restart the shimmer on each update.
    while (this.rootEl.childElementCount > count) {
      this.rootEl.lastElementChild!.remove();
    }
    while (this.rootEl.childElementCount < count) {
      const line = document.createElement("span");
      line.setAttribute("part", "skeleton");
      this.rootEl.append(line);
    }
    for (const child of Array.from(this.rootEl.children)) {
      // Via the CSSOM, for the same reason the box variant does: the value is
      // author input and setProperty drops anything that is not a length.
      (child as HTMLElement).style.setProperty("height", height);
    }
  }

  private renderGrid(): void {
    this.rootEl.style.setProperty("--boe-skeleton-columns", String(this.columns));
    this.rootEl.style.setProperty("--boe-skeleton-row-height", this.rowHeight);

    // Rebuilt rather than patched: a change to items can alter every region's
    // span and offset, so there is no stable identity to reuse.
    this.rootEl.replaceChildren();
    for (const item of this.resolvedItems) {
      if (item.offset > 0) {
        const spacer = document.createElement("span");
        spacer.setAttribute("part", "grid-offset");
        spacer.style.setProperty("grid-column", `span ${item.offset}`);
        this.rootEl.append(spacer);
      }
      const region = document.createElement("span");
      region.setAttribute("part", "skeleton");
      region.style.setProperty("grid-column", `span ${item.span}`);
      region.style.setProperty("grid-row", `span ${item.rowSpan}`);
      this.rootEl.append(region);
    }
  }
}

Skeleton.register();
