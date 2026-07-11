const DEFAULT_TAG_NAME = "box-tree";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxTreeItem = {
  children?: BoxTreeItem[];
  label: string;
  value?: string;
};

const collectBranchKeys = (items: BoxTreeItem[]): string[] => {
  const keys: string[] = [];

  for (const item of items) {
    if ((item.children?.length ?? 0) > 0) {
      const key = item.value ?? item.label;
      keys.push(key, ...collectBranchKeys(item.children ?? []));
    }
  }

  return keys;
};

export class BoxTreeElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private expandedInternal = new Set<string>();
  private valueInternal = "";
  private focusKey: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Tree";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxTreeItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxTreeItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxTreeItem[]) {
    this.setAttribute("items", JSON.stringify(value));
    this.seedExpandedState(value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.render();
  }

  connectedCallback(): void {
    this.seedExpandedState(this.items);
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "items") {
      this.seedExpandedState(this.items);
    }

    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    this.render();
  }

  private seedExpandedState(items: BoxTreeItem[], depth = 0): void {
    for (const item of items) {
      if ((item.children?.length ?? 0) > 0 && depth === 0) {
        const key = item.value ?? item.label;
        this.expandedInternal.add(key);
        this.seedExpandedState(item.children ?? [], depth + 1);
      }
    }
  }

  private toggleExpanded(key: string): void {
    if (this.expandedInternal.has(key)) {
      this.expandedInternal.delete(key);
    } else {
      this.expandedInternal.add(key);
    }
    this.render();
  }

  private expandAll(): void {
    this.expandedInternal = new Set(collectBranchKeys(this.items));
    this.render();
  }

  private collapseAll(): void {
    this.expandedInternal.clear();
    this.render();
  }

  private getVisibleNodes(
    items: BoxTreeItem[],
    depth = 0,
  ): Array<{ depth: number; hasChildren: boolean; key: string; value: string }> {
    const nodes: Array<{ depth: number; hasChildren: boolean; key: string; value: string }> = [];

    for (const item of items) {
      const key = item.value ?? item.label;
      const value = item.value ?? key;
      const hasChildren = (item.children?.length ?? 0) > 0;
      nodes.push({ depth, hasChildren, key, value });

      if (hasChildren && this.expandedInternal.has(key)) {
        nodes.push(...this.getVisibleNodes(item.children ?? [], depth + 1));
      }
    }

    return nodes;
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

  private renderItems(items: BoxTreeItem[], depth = 0): string {
    return items
      .map(item => {
        const key = item.value ?? item.label;
        const hasChildren = (item.children?.length ?? 0) > 0;
        const isExpanded = this.expandedInternal.has(key);
        const isSelected = item.value === this.valueInternal;
        const togglePart = isExpanded ? "toggle toggle-expanded" : "toggle";
        const itemPart = isSelected ? "item item-selected" : "item";
        const childrenMarkup =
          hasChildren && isExpanded
            ? `<div part="children" role="group">${this.renderItems(item.children ?? [], depth + 1)}</div>`
            : "";

        return `
          <div part="node" data-depth="${depth}">
            <div part="row">
              ${
                hasChildren
                  ? `<button
                      type="button"
                      part="${togglePart}"
                      data-key="${escapeHtml(key)}"
                      aria-expanded="${String(isExpanded)}"
                    >${this.renderToggleIcon(isExpanded)}</button>`
                  : `<span part="spacer" aria-hidden="true"></span>`
              }
              <button
                type="button"
                part="${itemPart}"
                role="treeitem"
                data-key="${escapeHtml(key)}"
                ${item.value ? `data-value="${escapeHtml(item.value)}"` : ""}
                data-branch="${String(hasChildren)}"
                data-selected="${String(isSelected)}"
                aria-level="${depth + 1}"
                ${hasChildren ? `aria-expanded="${String(isExpanded)}"` : ""}
                ${item.value ? `aria-selected="${String(isSelected)}"` : ""}
                tabindex="${
                  key === (this.focusKey ?? (this.valueInternal || (this.items[0]?.value ?? this.items[0]?.label ?? "")))
                    ? "0"
                    : "-1"
                }"
              >
                ${escapeHtml(item.label)}
              </button>
            </div>
            ${childrenMarkup}
          </div>
        `;
      })
      .join("");
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const branchKeys = collectBranchKeys(this.items);
    const hasBranches = branchKeys.length > 0;
    const allExpanded = hasBranches && branchKeys.every(key => this.expandedInternal.has(key));

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="shell"] {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          align-content: start;
          min-height: 0;
        }

        [part="tree"] {
          display: grid;
          gap: 0.375rem;
          min-height: 0;
          align-content: start;
        }

        [part="controls"] {
          display: flex;
          justify-content: flex-end;
          gap: 0.45rem;
          margin-bottom: 0.55rem;
          padding-bottom: 0.15rem;
        }

        [part="node"] {
          display: grid;
          gap: 0.375rem;
        }

        [part="row"] {
          display: grid;
          grid-template-columns: 1.125rem minmax(0, 1fr);
          gap: 0.55rem;
          align-items: center;
          padding: 0.16rem 0.18rem;
          border-radius: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 78%, transparent);
        }

        [part="children"] {
          display: grid;
          gap: 0.375rem;
          margin-left: 0.5625rem;
          padding-left: 1.1875rem;
          border-left: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
        }

        [part~="toggle"] {
          width: 1.125rem;
          height: 1.125rem;
          display: inline-grid;
          place-items: center;
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 88%, white 12%);
          border-radius: 0.35rem;
          padding: 0;
          line-height: 1;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 3%, var(--boe-token-surface-surface-secondary, #f7f9fc) 18%, var(--boe-token-surface-surface, #ffffff) 79%) 100%
            );
          color: var(--boe-token-text-text-secondary, #52606d);
          font: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
        }

        [part~="control"] {
          width: 1.5rem;
          height: 1.5rem;
          display: inline-grid;
          place-items: center;
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 88%, white 12%);
          border-radius: 0.375rem;
          padding: 0;
          line-height: 1;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface-secondary, #f7f9fc) 18%, var(--boe-token-surface-surface, #ffffff) 78%) 100%
            );
          color: var(--boe-token-text-text-secondary, #52606d);
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
        }

        [part~="toggle-expanded"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part~="toggle"] svg {
          width: 0.625rem;
          height: 0.625rem;
          display: block;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.6;
          stroke-linecap: round;
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

        [part="spacer"] {
          width: 1.125rem;
          height: 1.125rem;
          display: inline-block;
        }

        [part~="item"] {
          appearance: none;
          text-align: left;
          border: 1px solid transparent;
          border-radius: 0.85rem;
          padding: 0.46rem 0.68rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 8%, var(--boe-token-surface-surface, #ffffff) 92%) 100%
            );
          color: var(--boe-token-text-text, #101820);
          font: inherit;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part~="item"]:hover {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 68%, white 32%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-item-surface-hover, #eef4fb) 62%, white 34%) 100%
            );
        }

        [part~="item-selected"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #e8f1ff) 78%, white 22%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #e8f1ff) 64%, var(--boe-token-surface-surface, #ffffff) 36%) 100%
            );
          color: var(--boe-token-text-text, #101820);
          box-shadow:
            inset 0 0 0 1px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        [part~="item"]:focus-visible,
        [part~="toggle"]:focus-visible,
        [part~="control"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="shell">
        ${hasBranches
          ? `<div part="controls">
            <button
              type="button"
              part="control control-expand-all"
              data-action="expand-all"
              aria-label="Expand all"
              title="Expand all"
              ${allExpanded ? "disabled" : ""}
            >${this.renderControlIcon("expand-all")}</button>
            <button
              type="button"
              part="control control-collapse-all"
              data-action="collapse-all"
              aria-label="Collapse all"
              title="Collapse all"
              ${!this.expandedInternal.size ? "disabled" : ""}
            >${this.renderControlIcon("collapse-all")}</button>
          </div>`
          : ""}
        <div part="tree" role="tree" aria-label="${escapeHtml(this.label)}">
          ${this.renderItems(this.items)}
        </div>
      </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part~="control"]').forEach(control => {
      control.addEventListener("click", () => {
        const action = (control as HTMLButtonElement).dataset.action;
        if (action === "expand-all") {
          this.expandAll();
          return;
        }

        if (action === "collapse-all") {
          this.collapseAll();
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part~="toggle"]').forEach(toggle => {
      toggle.addEventListener("click", () => {
        const key = (toggle as HTMLButtonElement).dataset.key ?? "";
        if (key) {
          this.toggleExpanded(key);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part~="item"]').forEach(item => {
      item.addEventListener("click", () => {
        const element = item as HTMLButtonElement;
        const value = element.dataset.value ?? "";
        const key = element.dataset.key ?? "";
        const isBranch = element.dataset.branch === "true";

        if (!value && isBranch && key) {
          this.toggleExpanded(key);
          return;
        }

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
      });

      item.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const element = item as HTMLButtonElement;
        const key = element.dataset.key ?? "";
        const isBranch = element.dataset.branch === "true";
        const visibleNodes = this.getVisibleNodes(this.items);
        const currentIndex = visibleNodes.findIndex(node => node.key === key);

        if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "ArrowUp") {
          keyboardEvent.preventDefault();
          const nextIndex =
            keyboardEvent.key === "ArrowDown"
              ? Math.min(visibleNodes.length - 1, currentIndex + 1)
              : Math.max(0, currentIndex - 1);
          const nextNode = visibleNodes[nextIndex];
          if (nextNode) {
            this.focusKey = nextNode.key;
            this.render();
          }
          return;
        }

        if (keyboardEvent.key === "ArrowRight" && isBranch) {
          keyboardEvent.preventDefault();
          if (!this.expandedInternal.has(key)) {
            this.expandedInternal.add(key);
            this.focusKey = key;
            this.render();
          }
          return;
        }

        if (keyboardEvent.key === "ArrowLeft" && isBranch) {
          keyboardEvent.preventDefault();
          if (this.expandedInternal.has(key)) {
            this.expandedInternal.delete(key);
            this.focusKey = key;
            this.render();
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
          const nextNode = keyboardEvent.key === "Home" ? visibleNodes[0] : visibleNodes[visibleNodes.length - 1];
          if (nextNode) {
            this.focusKey = nextNode.key;
            this.render();
          }
        }
      });
    });

    if (this.focusKey) {
      queueMicrotask(() => {
        const target = Array.from(this.shadowRoot?.querySelectorAll('[part~="item"]') ?? []).find(
          node => (node as HTMLButtonElement).dataset.key === this.focusKey,
        ) as HTMLButtonElement | undefined;
        target?.focus();
      });
    }
  }
}

export const defineBoxTreeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTreeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTreeElement;
  }

  customElements.define(tagName, BoxTreeElement);
  return BoxTreeElement;
};
