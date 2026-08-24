import { BaseElement } from "../../core/index.js";
import {
  BOE_GRID_COLUMNS,
  BOE_GRID_GUTTER_PROPERTY,
  boeGridGutterStyles,
  resolveGridCount,
} from "../../foundations/layout/index.js";

const DEFAULT_TAG_NAME = "box-grid";

/**
 * How far a child's placement attributes are honoured.
 *
 * Placement is expressed in CSS rules generated per value, not computed per
 * element, so the ceiling is a real limit rather than a guess. Twenty-four
 * covers a twelve-column grid used at double density without emitting rules
 * nobody will match.
 */
const MAX_TRACKS = 24;

/**
 * Placement rules, one per value.
 *
 * A slotted child cannot be given a computed `grid-column` without writing to
 * the light DOM, which is the host's tree, not ours. Generating a rule per
 * value keeps placement declarative and leaves the author's markup untouched.
 *
 * `grid-column-start` and `grid-column-end` are set by separate rules on
 * purpose: they compose, so offset and span combine without needing a rule for
 * every offset × span pair.
 */
const placementRules = (): string => {
  const rules: string[] = [];
  for (let value = 1; value <= MAX_TRACKS; value += 1) {
    rules.push(`  ::slotted([data-span="${value}"]) { grid-column-end: span ${value}; }`);
    rules.push(`  ::slotted([data-row-span="${value}"]) { grid-row: span ${value}; }`);
  }
  for (let value = 1; value < MAX_TRACKS; value += 1) {
    // An offset of N starts the region at column N + 1.
    rules.push(`  ::slotted([data-offset="${value}"]) { grid-column-start: ${value + 1}; }`);
  }
  return rules.join("\n");
};

const elementStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  :host([hidden]) {
    display: none;
  }

${boeGridGutterStyles(":host")}

  [part="grid"] {
    display: grid;
    grid-template-columns: repeat(var(--boe-grid-columns, ${BOE_GRID_COLUMNS}), minmax(0, 1fr));
    gap: var(${BOE_GRID_GUTTER_PROPERTY});
  }

  /* Rows are only constrained when the author asks for them; otherwise each
     row is as tall as its content, which is what a layout grid should do.
     Spectrum's layout regions have no intrinsic height either — at minimum
     they are as tall as the components inside them. */
  :host([row-height]) [part="grid"] {
    grid-auto-rows: var(--boe-grid-row-height);
  }

  /* Without this the slot itself is the grid item and every child lands in one
     cell. display: contents dissolves it, so the assigned children become the
     grid's own items. */
  slot {
    display: contents;
  }

  /* A region with no placement attributes occupies one column, so a bare list
     of children reads as an even row. */
  ::slotted(*) {
    grid-column-end: span 1;
  }

${placementRules()}
`;

/**
 * Adobe Spectrum's responsive grid, for laying out arbitrary content.
 *
 * Twelve columns by default, with gutters stepping 16 → 24 → 32 → 40 → 48px
 * across Spectrum's breakpoints. Children declare their own placement:
 *
 * ```html
 * <box-grid columns="12">
 *   <article data-span="8">Main</article>
 *   <aside data-span="4">Sidebar</aside>
 *   <footer data-span="6" data-offset="3">Centred</footer>
 * </box-grid>
 * ```
 *
 * Placement lives on the children rather than in a payload on the host,
 * because the children are arbitrary content the author already writes — an
 * `items` array would have to address them positionally and would silently
 * mis-place everything the moment one was inserted.
 *
 * `data-offset` sets an explicit `grid-column-start`. That is the author's
 * stated intent here, unlike `box-skeleton`, which generates its own regions
 * and uses spacers so auto-placement is not disturbed.
 */
export class Grid extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["columns", "row-height"];
  }

  private gridEl!: HTMLElement;

  /** Columns in the grid. Defaults to Spectrum's twelve. */
  get columns(): number {
    return resolveGridCount(this.getAttribute("columns"), BOE_GRID_COLUMNS);
  }

  set columns(value: number) {
    this.setAttribute("columns", String(value));
  }

  /**
   * Height of one row. Unset by default: a layout grid's rows should be as
   * tall as their content, and pinning them would crop it.
   */
  get rowHeight(): string {
    return this.getAttribute("row-height") ?? "";
  }

  set rowHeight(value: string) {
    if (value) {
      this.setAttribute("row-height", value);
      return;
    }
    this.removeAttribute("row-height");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `<style>${elementStyles}</style><div part="grid"><slot></slot></div>`;
    this.gridEl = this.shadowRoot.querySelector('[part="grid"]')!;
  }

  protected setupListeners(): void {
    // Layout only: placement is declared by the children and applied in CSS.
  }

  protected update(): void {
    if (!this.gridEl) {
      return;
    }
    this.gridEl.style.setProperty("--boe-grid-columns", String(this.columns));
    // Via the CSSOM rather than interpolated into markup. Note that custom
    // properties are *not* validated the way a standard property like `width`
    // is — they accept almost any token sequence — so this does not sanitise
    // the value. What makes it safe is that the value never reaches an HTML
    // string: a nonsensical one makes `grid-auto-rows` invalid at computed-value
    // time, which falls back to `auto`, and rows simply size to their content.
    this.gridEl.style.setProperty("--boe-grid-row-height", this.rowHeight);
  }
}

Grid.register();
