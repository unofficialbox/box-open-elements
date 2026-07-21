import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius, boeSpace } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-table";

export interface TableColumn {
  key: string;
  label: string;
  /** Cross-axis alignment of the column's cells. */
  align?: "start" | "end" | "center";
  /** Mark the column sortable — clicking its header emits `sort`. */
  sortable?: boolean;
}

export interface TableRow {
  id: string;
  /** Cell text keyed by column key, or positional strings matching `columns`. */
  cells: Record<string, string> | string[];
}

export type TableSelectionMode = "none" | "single" | "multiple";

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
  }
  th[part="sortable"]:hover { color: var(--boe-token-text-text, #222222); }
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
`;

/**
 * A semantic, selectable data table — box-ui-elements `Table` + `makeSelectable`.
 * Rows and columns come from JSON. Selection supports single / Ctrl-click toggle
 * / Shift-click range, plus keyboard (Arrow, Shift+Arrow to extend, Space to
 * toggle, Ctrl/Cmd+A select-all, Escape clear). Sorting is host-owned: sortable
 * headers emit `sort` and the host reorders `rows`.
 */
export class BoxTableElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["columns", "rows", "selection-mode", "label", "sort-key", "sort-direction"];
  }

  private bodyEl!: HTMLElement;
  private headEl!: HTMLElement;
  private selected = new Set<string>();
  private anchorIndex = -1;

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

  private cellText(row: TableRow, column: TableColumn, index: number): string {
    if (Array.isArray(row.cells)) {
      return row.cells[index] ?? "";
    }
    return row.cells[column.key] ?? "";
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

  private onBodyKeydown(event: KeyboardEvent): void {
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
      new CustomEvent("sort", { bubbles: true, composed: true, detail: { key, direction } }),
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
      new CustomEvent("selection-changed", {
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

    this.shadowRoot?.querySelector('[part="table"]')?.setAttribute("aria-label", this.label);
    this.shadowRoot?.querySelector('[part="table"]')?.setAttribute("role", selectable ? "grid" : "table");

    this.headEl.innerHTML = columns
      .map(column => {
        const align = column.align ? ` data-align="${column.align}"` : "";
        if (column.sortable) {
          const sort =
            sortKey === column.key ? ` aria-sort="${sortDir === "descending" ? "descending" : "ascending"}"` : ' aria-sort="none"';
          return `<th part="sortable" scope="col" data-key="${escapeHtml(column.key)}"${align}${sort}>${escapeHtml(column.label)}<span class="boe-sort-arrow" aria-hidden="true"></span></th>`;
        }
        return `<th scope="col"${align}>${escapeHtml(column.label)}</th>`;
      })
      .join("");

    this.bodyEl.innerHTML = rows
      .map((row, index) => {
        const selected = this.selected.has(row.id);
        const rowAttrs = selectable
          ? ` part="row" role="row" tabindex="${index === 0 ? "0" : "-1"}" aria-selected="${selected}"`
          : ' part="row" role="row"';
        const cells = columns
          .map(column => {
            const align = column.align ? ` data-align="${column.align}"` : "";
            const role = selectable ? ' role="gridcell"' : ' role="cell"';
            return `<td${align}${role}>${escapeHtml(this.cellText(row, column, columns.indexOf(column)))}</td>`;
          })
          .join("");
        return `<tr${rowAttrs} data-index="${index}" data-id="${escapeHtml(row.id)}">${cells}</tr>`;
      })
      .join("");
  }
}

export const defineBoxTableElement = (tagName = DEFAULT_TAG_NAME): typeof BoxTableElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTableElement;
  }

  customElements.define(tagName, BoxTableElement);
  return BoxTableElement;
};
