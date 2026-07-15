import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-tree-grid";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxTreeGridColumn = {
  key: string;
  label: string;
};

type BoxTreeGridItem = {
  children?: BoxTreeGridItem[];
  cells?: string[];
  label: string;
  value: string;
};

const collectBranchValues = (items: BoxTreeGridItem[]): string[] => {
  const values: string[] = [];

  for (const item of items) {
    if ((item.children?.length ?? 0) > 0) {
      values.push(item.value, ...collectBranchValues(item.children ?? []));
    }
  }

  return values;
};

const treeGridStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="controls"] {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
  }

  [part="controls"][hidden] {
    display: none;
  }

  [part~="control"] {
    width: 1.5rem;
    height: 1.5rem;
    display: inline-grid;
    place-items: center;
    appearance: none;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
    border-radius: 0.375rem;
    padding: 0;
    line-height: 1;
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, #eef4fb 6%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
  }

  [part~="control"] svg {
    width: 0.75rem;
    height: 0.75rem;
    display: block;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [part~="control"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }
`;

export class BoxTreeGridElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["columns", "items", "label", "value"];
  }

  private expandedInternal = new Set<string>();
  private valueInternal = "";
  private focusValue: string | null = null;

  private controlsEl!: HTMLElement;
  private expandAllEl!: HTMLButtonElement;
  private collapseAllEl!: HTMLButtonElement;
  private treeGridEl!: HTMLElement;
  private headerRowEl!: HTMLElement;
  private bodyEl!: HTMLElement;

  get columns(): BoxTreeGridColumn[] {
    const raw = this.getAttribute("columns");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxTreeGridColumn[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set columns(value: BoxTreeGridColumn[]) {
    this.setAttribute("columns", JSON.stringify(value));
  }

  get items(): BoxTreeGridItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxTreeGridItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxTreeGridItem[]) {
    this.setAttribute("items", JSON.stringify(value));
    this.seedExpandedState(value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Tree Grid";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  connectedCallback(): void {
    this.seedExpandedState(this.items);
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "items") {
      this.seedExpandedState(this.items);
    }

    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private seedExpandedState(items: BoxTreeGridItem[], depth = 0): void {
    for (const item of items) {
      if ((item.children?.length ?? 0) > 0 && depth === 0) {
        this.expandedInternal.add(item.value);
        this.seedExpandedState(item.children ?? [], depth + 1);
      }
    }
  }

  private toggleExpanded(value: string): void {
    if (this.expandedInternal.has(value)) {
      this.expandedInternal.delete(value);
    } else {
      this.expandedInternal.add(value);
    }

    this.update();
  }

  private expandAll(): void {
    this.expandedInternal = new Set(collectBranchValues(this.items));
    this.update();
  }

  private collapseAll(): void {
    this.expandedInternal.clear();
    this.update();
  }

  private getVisibleRows(
    items: BoxTreeGridItem[],
    depth = 0,
  ): Array<{ depth: number; hasChildren: boolean; value: string }> {
    const rows: Array<{ depth: number; hasChildren: boolean; value: string }> = [];

    for (const item of items) {
      const hasChildren = (item.children?.length ?? 0) > 0;
      rows.push({ depth, hasChildren, value: item.value });

      if (hasChildren && this.expandedInternal.has(item.value)) {
        rows.push(...this.getVisibleRows(item.children ?? [], depth + 1));
      }
    }

    return rows;
  }

  private renderToggleIcon(isExpanded: boolean): string {
    const verticalStroke = isExpanded ? "" : '<path d="M6 2.25V9.75" />';
    return `
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2.25 6H9.75" />
        ${verticalStroke}
      </svg>
    `;
  }

  private renderControlIcon(type: "expand-all" | "collapse-all"): string {
    const verticalStroke = type === "expand-all" ? '<path d="M6 3.9V8.1" />' : "";
    return `
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect x="1.5" y="1.5" width="9" height="9" rx="0.8" />
        <path d="M4.15 6H7.85" />
        ${verticalStroke}
      </svg>
    `;
  }

  private renderRows(items: BoxTreeGridItem[], depth = 0): string {
    return items
      .map(item => {
        const hasChildren = (item.children?.length ?? 0) > 0;
        const isExpanded = this.expandedInternal.has(item.value);
        const isSelected = item.value === this.valueInternal;
        const togglePart = isExpanded ? "toggle toggle-expanded" : "toggle";
        const rowPart = isSelected ? "row row-selected" : "row";
        const itemPart = isSelected ? "item item-selected" : "item";
        const cellMarkup = (item.cells ?? [])
          .map(
            (cell, index) => `
              <div part="cell" role="gridcell" data-column-index="${index + 1}">
                ${escapeHtml(cell)}
              </div>
            `,
          )
          .join("");

        const childrenMarkup =
          hasChildren && isExpanded ? this.renderRows(item.children ?? [], depth + 1) : "";

        return `
          <div
            part="${rowPart}"
            role="row"
            data-depth="${depth}"
            data-selected="${String(isSelected)}"
            aria-level="${depth + 1}"
            ${hasChildren ? `aria-expanded="${String(isExpanded)}"` : ""}
            aria-selected="${String(isSelected)}"
          >
            <div part="tree-cell" role="gridcell">
              <div part="tree-content" style="--tree-grid-depth:${depth};">
                ${
                  hasChildren
                    ? `<button
                        type="button"
                        part="${togglePart}"
                        data-value="${escapeHtml(item.value)}"
                        aria-expanded="${String(isExpanded)}"
                      >${this.renderToggleIcon(isExpanded)}</button>`
                    : `<span part="spacer" aria-hidden="true"></span>`
                }
                <button
                  type="button"
                  part="${itemPart}"
                  role="rowheader"
                  data-value="${escapeHtml(item.value)}"
                  data-branch="${String(hasChildren)}"
                  tabindex="${
                    item.value === (this.focusValue ?? (this.valueInternal || this.items[0]?.value || "")) ? "0" : "-1"
                  }"
                >
                  ${escapeHtml(item.label)}
                </button>
              </div>
            </div>
            ${cellMarkup}
          </div>
          ${childrenMarkup}
        `;
      })
      .join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${treeGridStyles}</style>
      <div part="controls" hidden>
        <button
          type="button"
          part="control control-expand-all"
          data-action="expand-all"
          aria-label="Expand all"
          title="Expand all"
        >${this.renderControlIcon("expand-all")}</button>
        <button
          type="button"
          part="control control-collapse-all"
          data-action="collapse-all"
          aria-label="Collapse all"
          title="Collapse all"
        >${this.renderControlIcon("collapse-all")}</button>
      </div>
      <section part="tree-grid" role="treegrid">
        <div part="header-row" role="row"></div>
        <div part="body" role="rowgroup"></div>
      </section>
    `;

    this.controlsEl = this.shadowRoot.querySelector('[part="controls"]')!;
    this.expandAllEl = this.shadowRoot.querySelector('[data-action="expand-all"]')!;
    this.collapseAllEl = this.shadowRoot.querySelector('[data-action="collapse-all"]')!;
    this.treeGridEl = this.shadowRoot.querySelector('[part="tree-grid"]')!;
    this.headerRowEl = this.shadowRoot.querySelector('[part="header-row"]')!;
    this.bodyEl = this.shadowRoot.querySelector('[part="body"]')!;
  }

  protected setupListeners(): void {
    this.controlsEl.addEventListener("click", event => {
      const control = (event.target as HTMLElement | null)?.closest(
        '[part~="control"]',
      ) as HTMLButtonElement | null;
      if (!control || !this.controlsEl.contains(control)) {
        return;
      }
      const action = control.dataset.action;
      if (action === "expand-all") {
        this.expandAll();
        return;
      }
      if (action === "collapse-all") {
        this.collapseAll();
      }
    });

    this.bodyEl.addEventListener("click", event => {
      const target = event.target as HTMLElement | null;
      const toggle = target?.closest('[part~="toggle"]') as HTMLButtonElement | null;
      if (toggle && this.bodyEl.contains(toggle)) {
        const value = toggle.dataset.value ?? "";
        if (value) {
          this.toggleExpanded(value);
        }
        return;
      }

      const item = target?.closest('[part~="item"]') as HTMLButtonElement | null;
      if (!item || !this.bodyEl.contains(item)) {
        return;
      }

      const value = item.dataset.value ?? "";
      if (!value || value === this.valueInternal) {
        return;
      }

      this.valueInternal = value;
      this.setAttribute("value", value);
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value },
        }),
      );
      this.update();
    });

    this.bodyEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const element = (keyboardEvent.target as HTMLElement | null)?.closest(
        '[part~="item"]',
      ) as HTMLButtonElement | null;
      if (!element || !this.bodyEl.contains(element)) {
        return;
      }

      const value = element.dataset.value ?? "";
      const isBranch = element.dataset.branch === "true";
      const visibleRows = this.getVisibleRows(this.items);
      const currentIndex = visibleRows.findIndex(row => row.value === value);

      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        const nextIndex =
          keyboardEvent.key === "ArrowDown"
            ? Math.min(visibleRows.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
        const nextRow = visibleRows[nextIndex];
        if (nextRow) {
          this.focusValue = nextRow.value;
          this.update();
        }
        return;
      }

      if (keyboardEvent.key === "ArrowRight" && isBranch) {
        keyboardEvent.preventDefault();
        if (!this.expandedInternal.has(value)) {
          this.expandedInternal.add(value);
          this.focusValue = value;
          this.update();
        }
        return;
      }

      if (keyboardEvent.key === "ArrowLeft" && isBranch) {
        keyboardEvent.preventDefault();
        if (this.expandedInternal.has(value)) {
          this.expandedInternal.delete(value);
          this.focusValue = value;
          this.update();
        }
        return;
      }

      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        element.click();
        return;
      }

      if (keyboardEvent.key === "Home" || keyboardEvent.key === "End") {
        keyboardEvent.preventDefault();
        const nextRow = keyboardEvent.key === "Home" ? visibleRows[0] : visibleRows[visibleRows.length - 1];
        if (nextRow) {
          this.focusValue = nextRow.value;
          this.update();
        }
      }
    });
  }

  protected update(): void {
    if (!this.controlsEl || !this.treeGridEl || !this.headerRowEl || !this.bodyEl) {
      return;
    }

    const columns = this.columns;
    const branchValues = collectBranchValues(this.items);
    const hasBranches = branchValues.length > 0;
    const allExpanded = hasBranches && branchValues.every(value => this.expandedInternal.has(value));
    const columnTemplate = ["minmax(260px, 1.5fr)", ...columns.slice(1).map(() => "minmax(120px, 1fr)")].join(" ");

    this.controlsEl.hidden = !hasBranches;
    this.expandAllEl.disabled = allExpanded;
    this.collapseAllEl.disabled = !this.expandedInternal.size;

    this.treeGridEl.style.setProperty("--tree-grid-columns", columnTemplate);
    this.treeGridEl.setAttribute("aria-label", this.label);

    this.headerRowEl.innerHTML = columns
      .map(
        (column, index) => `
          <div part="header-cell" role="columnheader" data-column-index="${index}">
            ${escapeHtml(column.label)}
          </div>
        `,
      )
      .join("");

    this.bodyEl.innerHTML = this.items.length
      ? this.renderRows(this.items)
      : `<div part="empty">No items loaded</div>`;

    if (this.focusValue) {
      const valueToFocus = this.focusValue;
      this.focusValue = null;
      queueMicrotask(() => {
        const target = Array.from(this.bodyEl.querySelectorAll('[part~="item"]')).find(
          node => (node as HTMLButtonElement).dataset.value === valueToFocus,
        ) as HTMLButtonElement | undefined;
        target?.focus();
      });
    }
  }
}

export const defineBoxTreeGridElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTreeGridElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTreeGridElement;
  }

  customElements.define(tagName, BoxTreeGridElement);
  return BoxTreeGridElement;
};
