import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { isSafeHref } from "../../patterns/internal/safe-href.js";

const DEFAULT_TAG_NAME = "box-table";

export interface TableColumn {
  key: string;
  label: string;
  /** Cross-axis alignment of the column's cells. */
  align?: "start" | "end" | "center";
  /** Mark the column sortable — clicking its header emits `sort`. */
  sortable?: boolean;
}

export type TableCellTone = "neutral" | "brand" | "success" | "warning" | "error";

/**
 * Declarative cell content beyond plain text. Deliberately a descriptor the
 * table renders itself, never an HTML string or a render callback: cell data
 * is server-supplied and stays escaped — a string renderer would reopen the
 * injection hole the escaping exists to close.
 */
export interface TableCellDescriptor {
  kind: "text" | "badge" | "link";
  text: string;
  /** Badge colour; the text still carries the meaning. */
  tone?: TableCellTone;
  /** Link target; non-http(s) schemes render as plain text. */
  href?: string;
}

export type TableCellValue = string | TableCellDescriptor;

export interface TableRow {
  id: string;
  /** Cell values keyed by column key, or positional, matching `columns`. */
  cells: Record<string, TableCellValue> | TableCellValue[];
  /**
   * Expandable detail. Renders a per-row toggle and a full-width detail row
   * holding this text plus a `detail-<id>` slot for rich host content.
   */
  detail?: string;
}

export type TableSelectionMode = "none" | "single" | "multiple";

/** Detail of the `sort` event, for typed listeners. */
export interface TableSortDetail {
  key: string;
  direction: "ascending" | "descending";
}

/** Detail of the `selection-changed` event, for typed listeners. */
export interface TableSelectionChangedDetail {
  selectedIds: string[];
}

/** Detail of the `row-toggled` event, for typed listeners. */
export interface TableRowToggledDetail {
  rowId: string;
  expanded: boolean;
}

const CELL_TONES = new Set<TableCellTone>(["neutral", "brand", "success", "warning", "error"]);

const CELL_ALIGNS = new Set(["start", "end", "center"]);

/** `align` is author input from a JSON attribute like everything else — an
 * unvalidated value would close the attribute and inject markup. */
const alignAttr = (align: string | undefined): string =>
  align && CELL_ALIGNS.has(align) ? ` data-align="${align}"` : "";

const isCellDescriptor = (value: TableCellValue | undefined): value is TableCellDescriptor =>
  typeof value === "object" && value !== null && typeof value.text === "string";

/** Escape a value for use inside a double-quoted attribute selector. */
const cssAttrValue = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const tableStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="shell"] {
    border: ${boePanel.border};
    border-radius: ${boeRadius.large};
    overflow: auto;
    background: var(--boe-token-surface-surface, #ffffff);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    text-align: start;
    padding: ${boeSpace[2]} ${boeSpace[3]};
    background: var(--boe-token-surface-surface-secondary, #fbfbfb);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    position: sticky;
    top: 0;
  }

  th[data-align="end"], td[data-align="end"] { text-align: end; }
  th[data-align="center"], td[data-align="center"] { text-align: center; }

  th[part="sortable"] {
    cursor: pointer;
    user-select: none;
    /* The button carries the padding so its hit area fills the cell. */
    padding: 0;
  }
  th[part="sortable"]:hover { color: var(--boe-token-text-text, #222222); }

  /* A real button, so sorting is reachable by keyboard: focus, Enter and
     Space come from the platform instead of a keydown reimplementation. */
  [part="sort-button"] {
    appearance: none;
    display: block;
    width: 100%;
    padding: ${boeSpace[2]} ${boeSpace[3]};
    border: 0;
    background: transparent;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: inherit;
    color: inherit;
    cursor: pointer;
  }

  th[data-align="end"] [part="sort-button"] { text-align: end; }
  th[data-align="center"] [part="sort-button"] { text-align: center; }

  [part="sort-button"]:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--boe-token-surface-surface-brand, #0061d5);
  }
  th[aria-sort] .boe-sort-arrow::after { content: " ↕"; opacity: 0.5; }
  th[aria-sort="ascending"] .boe-sort-arrow::after { content: " ↑"; opacity: 1; }
  th[aria-sort="descending"] .boe-sort-arrow::after { content: " ↓"; opacity: 1; }

  tbody td {
    padding: ${boeSpace[2]} ${boeSpace[3]};
    border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    color: var(--boe-token-text-text, #222222);
  }

  tbody tr:last-child td { border-bottom: none; }

  tbody tr[part="row"] {
    outline: none;
  }

  :host([selection-mode]:not([selection-mode="none"])) tbody tr[part="row"] {
    cursor: pointer;
  }

  tbody tr[aria-selected="true"] td {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, transparent);
  }

  tbody tr[part="row"]:focus-visible td {
    box-shadow: inset 0 0 0 2px var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="cell-badge"] {
    display: inline-block;
    padding: 0.08rem 0.5rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 700;
    color: color-mix(in srgb, var(--cell-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 76%, black 24%);
    background: color-mix(in srgb, var(--cell-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--cell-tone, var(--boe-token-text-text-secondary, #6f6f6f)) 30%, transparent);
  }

  [part="cell-link"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    text-decoration: none;
  }

  [part="cell-link"]:hover {
    text-decoration: underline;
  }

  [part="expander"] {
    appearance: none;
    display: inline-grid;
    place-items: center;
    inline-size: 1.4rem;
    block-size: 1.4rem;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    font-size: 0.72rem;
    cursor: pointer;
  }

  [part="expander"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="expander"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 1px;
  }

  [part="expander"]::before {
    content: "▸";
    transition: transform 120ms ease;
  }

  [part="expander"][aria-expanded="true"]::before {
    transform: rotate(90deg);
  }

  tr[part="detail-row"] td {
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 80%, transparent);
    font-size: 0.84rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  tr[part="state-row"] td {
    padding: 1.1rem ${boeSpace[3]};
    text-align: center;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  tr[part="state-row"][data-state="error"] td {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 76%, black 24%);
  }

  [part="state-spinner"] {
    display: inline-block;
    vertical-align: -0.15rem;
    margin-inline-end: 0.45rem;
    inline-size: 0.95rem;
    block-size: 0.95rem;
    border-radius: 999px;
    border: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, transparent);
    border-top-color: var(--boe-token-surface-surface-brand, #0061d5);
    animation: boe-table-spin 0.9s linear infinite;
  }

  @keyframes boe-table-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    [part="state-spinner"] { animation-duration: 1.6s; }
  }

  /* Stacked rows: each row becomes a card, each cell states its column via
     data-label. Roles are explicit on rows and cells, so the grid semantics
     survive the display change. stacked="always" forces it; stacked="auto"
     stacks when the host container narrows. */
  :host {
    container-type: inline-size;
  }
` +
  ((): string => {
    const rules = (scope: string): string => `
  ${scope} thead { display: none; }
  ${scope} tr[part="row"] {
    display: block;
    padding: ${boeSpace[2]} 0;
  }
  ${scope} tbody td {
    display: grid;
    grid-template-columns: minmax(7.5rem, 9rem) 1fr;
    gap: 0.5rem;
    border-bottom: none;
    padding-block: 0.18rem;
    text-align: start;
  }
  ${scope} tbody td[data-label]::before {
    content: attr(data-label);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    align-self: center;
  }
  ${scope} tr[part="row"]:not(:last-child) {
    border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
  }
  ${scope} tr[part="detail-row"] td,
  ${scope} tr[part="state-row"] td {
    display: block;
  }
`;
    return `
  ${rules(':host([stacked]:not([stacked="auto"]))')}
  @container (max-width: 560px) {
    ${rules(':host([stacked="auto"])')}
  }
`;
  })();

/**
 * A semantic, selectable data table — box-ui-elements `Table` + `makeSelectable`.
 * Rows and columns come from JSON. Selection supports single / Ctrl-click toggle
 * / Shift-click range, plus keyboard (Arrow, Shift+Arrow to extend, Space to
 * toggle, Ctrl/Cmd+A select-all, Escape clear). Sorting is host-owned: sortable
 * headers emit `sort` and the host reorders `rows`.
 */
export class Table extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      "columns",
      "empty-text",
      "error-text",
      "label",
      "loading",
      "rows",
      "selection-mode",
      "sort-direction",
      "sort-key",
      "stacked",
    ];
  }

  private bodyEl!: HTMLElement;
  private headEl!: HTMLElement;
  private selected = new Set<string>();
  private anchorIndex = -1;
  private readonly expandedIds = new Set<string>();

  /** True while rows are being fetched: the body states "Loading rows…". */
  get loading(): boolean {
    return this.hasAttribute("loading");
  }

  set loading(value: boolean) {
    this.toggleAttribute("loading", Boolean(value));
  }

  /** What the body says when there are no rows and nothing is loading. */
  get emptyText(): string {
    return this.getAttribute("empty-text") ?? "No rows";
  }

  set emptyText(value: string) {
    this.setAttribute("empty-text", value);
  }

  /** Non-empty puts the table in an error state stating this text. */
  get errorText(): string {
    return this.getAttribute("error-text") ?? "";
  }

  set errorText(value: string) {
    if (value) {
      this.setAttribute("error-text", value);
    } else {
      this.removeAttribute("error-text");
    }
  }

  /** Ids of the rows whose detail is expanded (host-readable). */
  get expandedRows(): string[] {
    return [...this.expandedIds];
  }

  get columns(): TableColumn[] {
    return this.parseJson<TableColumn[]>("columns", []);
  }

  set columns(value: TableColumn[]) {
    this.setAttribute("columns", JSON.stringify(value));
  }

  get rows(): TableRow[] {
    return this.parseJson<TableRow[]>("rows", []);
  }

  set rows(value: TableRow[]) {
    this.setAttribute("rows", JSON.stringify(value));
  }

  get selectionMode(): TableSelectionMode {
    const mode = this.getAttribute("selection-mode");
    return mode === "single" || mode === "multiple" ? mode : "none";
  }

  set selectionMode(value: TableSelectionMode) {
    this.setAttribute("selection-mode", value);
  }

  get selectedIds(): string[] {
    return [...this.selected];
  }

  set selectedIds(value: string[]) {
    this.selected = new Set(value);
    if (this.isRendered) {
      this.update();
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Table";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  private parseJson<T>(attr: string, fallback: T): T {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as T;
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  private cellValue(row: TableRow, column: TableColumn, index: number): TableCellValue {
    if (Array.isArray(row.cells)) {
      return row.cells[index] ?? "";
    }
    return row.cells[column.key] ?? "";
  }

  /**
   * Descriptor rendering. Everything is escaped; a link with a non-http(s)
   * href renders as plain text; a badge's tone colours a word that already
   * carries the meaning.
   */
  private cellMarkup(value: TableCellValue): string {
    if (!isCellDescriptor(value)) {
      return escapeHtml(typeof value === "string" ? value : "");
    }
    if (value.kind === "badge") {
      const tone = value.tone && CELL_TONES.has(value.tone) ? value.tone : "neutral";
      const toneVar =
        tone === "neutral"
          ? "var(--boe-token-text-text-secondary, #6f6f6f)"
          : tone === "brand"
            ? "var(--boe-token-surface-surface-brand, #0061d5)"
            : `var(--boe-token-surface-status-surface-${tone}, #6f6f6f)`;
      return `<span part="cell-badge" style="--cell-tone:${toneVar};">${escapeHtml(value.text)}</span>`;
    }
    if (value.kind === "link" && value.href && isSafeHref(value.href)) {
      return `<a part="cell-link" href="${escapeHtml(value.href)}">${escapeHtml(value.text)}</a>`;
    }
    return escapeHtml(value.text);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${tableStyles}</style>
      <div part="shell">
        <table part="table">
          <thead><tr part="header-row"></tr></thead>
          <tbody part="body"></tbody>
        </table>
      </div>
    `;
    this.headEl = this.shadowRoot.querySelector('[part="header-row"]')!;
    this.bodyEl = this.shadowRoot.querySelector('[part="body"]')!;
  }

  protected setupListeners(): void {
    this.headEl.addEventListener("click", event => {
      const th = (event.target as HTMLElement).closest<HTMLElement>('th[part="sortable"]');
      if (!th) return;
      this.toggleSort(th.dataset.key ?? "");
    });

    this.bodyEl.addEventListener("click", event => {
      const expander = (event.target as HTMLElement).closest<HTMLElement>('[part="expander"]');
      if (expander) {
        this.toggleRowDetail(expander.dataset.rowId ?? "");
        return; // expanding is not selecting
      }
      const row = (event.target as HTMLElement).closest<HTMLElement>('[part="row"]');
      if (!row) return;
      const mouse = event as MouseEvent;
      this.activateRow(Number(row.dataset.index), { shift: mouse.shiftKey, toggle: mouse.ctrlKey || mouse.metaKey });
    });

    this.bodyEl.addEventListener("keydown", event => this.onBodyKeydown(event));
  }

  private rowElements(): HTMLElement[] {
    return Array.from(this.bodyEl.querySelectorAll<HTMLElement>('[part="row"]'));
  }

  private toggleRowDetail(rowId: string): void {
    if (!rowId) return;
    const expanded = !this.expandedIds.has(rowId);
    if (expanded) {
      this.expandedIds.add(rowId);
    } else {
      this.expandedIds.delete(rowId);
    }
    this.dispatchEvent(
      new CustomEvent<TableRowToggledDetail>("row-toggled", {
        bubbles: true,
        composed: true,
        detail: { rowId, expanded },
      }),
    );
    this.update();
    // update() rewrote the body, destroying the button that was activated;
    // put focus on its replacement so a keyboard user is not dropped.
    this.bodyEl
      .querySelector<HTMLButtonElement>(`[part="expander"][data-row-id="${cssAttrValue(rowId)}"]`)
      ?.focus();
  }

  private onBodyKeydown(event: KeyboardEvent): void {
    // Keys aimed at the expander button (Enter/Space activate it natively)
    // must not double as row selection.
    if ((event.target as HTMLElement).closest('[part="expander"]')) return;
    const rows = this.rowElements();
    if (rows.length === 0) return;
    const currentRow = (event.target as HTMLElement).closest<HTMLElement>('[part="row"]');
    const index = currentRow ? Number(currentRow.dataset.index) : -1;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      if (this.selectionMode === "multiple") {
        event.preventDefault();
        this.selectAll();
      }
      return;
    }
    if (event.key === "Escape") {
      if (this.selected.size) {
        event.preventDefault();
        this.setSelection([]);
      }
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      this.activateRow(index, { toggle: this.selectionMode === "multiple" });
      return;
    }

    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = Math.min(index + 1, rows.length - 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(index - 1, 0);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = rows.length - 1;
    else return;

    event.preventDefault();
    rows[nextIndex]?.focus();
    // Shift+Arrow extends the selection from the anchor.
    if (event.shiftKey && this.selectionMode === "multiple") {
      this.selectRange(this.anchorIndex < 0 ? index : this.anchorIndex, nextIndex);
    }
  }

  private toggleSort(key: string): void {
    const currentKey = this.getAttribute("sort-key");
    const currentDir = this.getAttribute("sort-direction");
    const direction = currentKey === key && currentDir === "ascending" ? "descending" : "ascending";
    this.dispatchEvent(
      new CustomEvent<TableSortDetail>("sort", {
        bubbles: true,
        composed: true,
        detail: { key, direction },
      }),
    );
  }

  private activateRow(index: number, options: { shift?: boolean; toggle?: boolean } = {}): void {
    const rows = this.rows;
    const row = rows[index];
    if (!row || this.selectionMode === "none") return;

    if (this.selectionMode === "single") {
      this.setSelection([row.id]);
      this.anchorIndex = index;
      return;
    }

    if (options.shift && this.anchorIndex >= 0) {
      this.selectRange(this.anchorIndex, index);
      return;
    }

    if (options.toggle) {
      const next = new Set(this.selected);
      next.has(row.id) ? next.delete(row.id) : next.add(row.id);
      this.setSelection([...next]);
    } else {
      this.setSelection([row.id]);
    }
    this.anchorIndex = index;
  }

  private selectRange(from: number, to: number): void {
    const rows = this.rows;
    const [start, end] = from <= to ? [from, to] : [to, from];
    const ids = rows.slice(start, end + 1).map(row => row.id);
    this.setSelection(ids);
  }

  private selectAll(): void {
    this.setSelection(this.rows.map(row => row.id));
  }

  private setSelection(ids: string[]): void {
    this.selected = new Set(ids);
    this.applySelectionState();
    this.dispatchEvent(
      new CustomEvent<TableSelectionChangedDetail>("selection-changed", {
        bubbles: true,
        composed: true,
        detail: { selectedIds: [...this.selected] },
      }),
    );
  }

  private applySelectionState(): void {
    for (const row of this.rowElements()) {
      const id = row.dataset.id ?? "";
      row.setAttribute("aria-selected", String(this.selected.has(id)));
    }
  }

  protected update(): void {
    if (!this.bodyEl || !this.headEl) return;
    const columns = this.columns;
    const rows = this.rows;
    const selectable = this.selectionMode !== "none";
    const sortKey = this.getAttribute("sort-key");
    const sortDir = this.getAttribute("sort-direction");
    // A non-string detail is malformed input, not a crash: it gets no expander.
    const expandable = rows.some(row => typeof row.detail === "string");
    const columnCount = columns.length + (expandable ? 1 : 0);

    const tableEl = this.shadowRoot?.querySelector('[part="table"]');
    tableEl?.setAttribute("aria-label", this.label);
    tableEl?.setAttribute("role", selectable ? "grid" : "table");
    if (this.loading) {
      tableEl?.setAttribute("aria-busy", "true");
    } else {
      tableEl?.removeAttribute("aria-busy");
    }

    this.headEl.innerHTML =
      (expandable ? `<th scope="col" aria-label="Row details"></th>` : "") +
      columns
        .map(column => {
          const align = alignAttr(column.align);
          if (column.sortable) {
            const sorted = sortKey === column.key;
            const sort = sorted
              ? ` aria-sort="${sortDir === "descending" ? "descending" : "ascending"}"`
              : ' aria-sort="none"';
            // The state, in words as well as the arrow glyph.
            const stateLabel = sorted
              ? `, sorted ${sortDir === "descending" ? "descending" : "ascending"}`
              : ", not sorted";
            return `<th part="sortable" scope="col" data-key="${escapeHtml(column.key)}"${align}${sort}><button type="button" part="sort-button" aria-label="Sort by ${escapeHtml(column.label)}${stateLabel}">${escapeHtml(column.label)}<span class="boe-sort-arrow" aria-hidden="true"></span></button></th>`;
          }
          return `<th scope="col"${align}>${escapeHtml(column.label)}</th>`;
        })
        .join("");

    // Loading, error, and empty are stated in words in the body — a blank
    // grid reads as broken. Loading wins; a stale error must not outlive a
    // retry that is visibly in flight.
    if (this.loading) {
      this.bodyEl.innerHTML = `<tr part="state-row" data-state="loading" role="row"><td role="${selectable ? "gridcell" : "cell"}" colspan="${String(columnCount)}"><span part="state-spinner" aria-hidden="true"></span>Loading rows…</td></tr>`;
      return;
    }
    if (this.errorText) {
      this.bodyEl.innerHTML = `<tr part="state-row" data-state="error" role="row"><td role="${selectable ? "gridcell" : "cell"}" colspan="${String(columnCount)}">${escapeHtml(this.errorText)}</td></tr>`;
      return;
    }
    if (rows.length === 0) {
      this.bodyEl.innerHTML = `<tr part="state-row" data-state="empty" role="row"><td role="${selectable ? "gridcell" : "cell"}" colspan="${String(columnCount)}">${escapeHtml(this.emptyText)}</td></tr>`;
      return;
    }

    this.bodyEl.innerHTML = rows
      .map((row, index) => {
        const selected = this.selected.has(row.id);
        const cellRole = selectable ? ' role="gridcell"' : ' role="cell"';
        const rowAttrs = selectable
          ? ` part="row" role="row" tabindex="${index === 0 ? "0" : "-1"}" aria-selected="${selected}"`
          : ' part="row" role="row"';
        const expanded = this.expandedIds.has(row.id);
        const expanderCell = expandable
          ? `<td${cellRole} part="expander-cell">${
              typeof row.detail === "string"
                ? `<button type="button" part="expander" data-row-id="${escapeHtml(row.id)}" aria-expanded="${String(expanded)}" aria-label="${expanded ? "Hide" : "Show"} details for row ${escapeHtml(row.id)}"></button>`
                : ""
            }</td>`
          : "";
        const cells = columns
          .map((column, columnIndex) => {
            const align = alignAttr(column.align);
            const value = this.cellValue(row, column, columnIndex);
            return `<td${align}${cellRole} data-label="${escapeHtml(column.label)}">${this.cellMarkup(value)}</td>`;
          })
          .join("");
        const rowMarkup = `<tr${rowAttrs} data-index="${index}" data-id="${escapeHtml(row.id)}">${expanderCell}${cells}</tr>`;
        // The detail row renders only while expanded, keeping the roving
        // tabindex and shift-range math on visible [part="row"] rows only.
        const detailRow =
          typeof row.detail === "string" && expanded
            ? `<tr part="detail-row" role="row" data-for="${escapeHtml(row.id)}"><td${cellRole} colspan="${String(columnCount)}">${escapeHtml(row.detail)}<slot name="detail-${escapeHtml(row.id)}"></slot></td></tr>`
            : "";
        return rowMarkup + detailRow;
      })
      .join("");
  }
}

Table.register();
