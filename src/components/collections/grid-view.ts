import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-grid-view";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxGridViewItem = {
  value: string;
  label: string;
  meta?: string;
  icon?: string;
};

const gridViewStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="grid"] {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    gap: 0.55rem;
  }

  [part~="tile"] {
    appearance: none;
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    text-align: center;
    cursor: pointer;
    transition: border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part~="tile-selected"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
  }

  ${boeNeutralInteractiveStyles('[part~="tile"]')}

  [part="thumb"] {
    display: grid;
    place-items: center;
    inline-size: 2.75rem;
    block-size: 2.75rem;
    border-radius: ${boeRadius.large};
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 1.1rem;
    font-weight: 700;
  }

  [part="tile-label"] {
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  [part="meta"] {
    font-size: 0.76rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="empty"] {
    padding: 0.7rem;
    text-align: center;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.9rem;
  }
`;

/**
 * A grid/gallery view mode for a collection, alongside `list` and `table`. Items
 * arrive as a `items` property (data in); single selection is exposed as `value`
 * and announced with a `value-changed` event (interaction out). Tiles form a
 * listbox: one tile is tabbable (roving `tabindex`), arrow keys move focus, and
 * Enter/Space or click selects. It owns no transport.
 */
export class BoxGridViewElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";
  private focusValue: string | null = null;
  private lastItemsJson = "";
  private contentEl!: HTMLElement;

  get items(): BoxGridViewItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxGridViewItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxGridViewItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Items";
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

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private selectValue(value: string): void {
    if (!value || value === this.valueInternal) {
      return;
    }

    this.valueInternal = value;
    this.setAttribute("value", value);
    this.focusValue = value;
    if (this.isRendered) {
      this.update();
    }
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  private moveFocus(current: string, delta: number): void {
    const items = this.items;
    if (!items.length) {
      return;
    }

    const currentIndex = items.findIndex(item => item.value === current);
    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + delta));
    const nextValue = items[nextIndex]?.value;
    if (nextValue) {
      this.focusValue = nextValue;
      this.update();
    }
  }

  private moveFocusTo(edge: "first" | "last"): void {
    const items = this.items;
    if (!items.length) {
      return;
    }

    const nextValue = edge === "first" ? items[0]?.value : items[items.length - 1]?.value;
    if (nextValue) {
      this.focusValue = nextValue;
      this.update();
    }
  }

  private renderTiles(items: BoxGridViewItem[]): string {
    const tabbableValue = this.focusValue ?? (this.valueInternal || items[0]?.value || "");

    return items
      .map(item => {
        const isSelected = item.value === this.valueInternal;
        const tilePart = isSelected ? "tile tile-selected" : "tile";
        const iconMarkup = item.icon ? escapeHtml(item.icon) : "";
        const metaMarkup = item.meta
          ? `<span part="meta">${escapeHtml(item.meta)}</span>`
          : "";

        return `
          <button
            type="button"
            part="${tilePart}"
            role="option"
            data-value="${escapeHtml(item.value)}"
            aria-selected="${String(isSelected)}"
            tabindex="${item.value === tabbableValue ? "0" : "-1"}"
          >
            <span part="thumb" aria-hidden="true">${iconMarkup}</span>
            <span part="tile-label">${escapeHtml(item.label)}</span>
            ${metaMarkup}
          </button>
        `;
      })
      .join("");
  }

  private getGridEl(): HTMLElement | null {
    return this.contentEl.querySelector('[part="grid"]');
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${gridViewStyles}</style>
      <div part="content"></div>
    `;
    this.contentEl = this.shadowRoot.querySelector('[part="content"]')!;
  }

  protected setupListeners(): void {
    this.contentEl.addEventListener("click", event => {
      const tile = (event.target as HTMLElement | null)?.closest('[part~="tile"]') as HTMLButtonElement | null;
      if (!tile || !this.contentEl.contains(tile)) {
        return;
      }
      this.selectValue(tile.dataset.value ?? "");
    });

    this.contentEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const tile = (keyboardEvent.target as HTMLElement | null)?.closest(
        '[part~="tile"]',
      ) as HTMLButtonElement | null;
      if (!tile || !this.contentEl.contains(tile)) {
        return;
      }

      const value = tile.dataset.value ?? "";

      switch (keyboardEvent.key) {
        case "ArrowRight":
        case "ArrowDown":
          keyboardEvent.preventDefault();
          this.moveFocus(value, 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          keyboardEvent.preventDefault();
          this.moveFocus(value, -1);
          break;
        case "Home":
          keyboardEvent.preventDefault();
          this.moveFocusTo("first");
          break;
        case "End":
          keyboardEvent.preventDefault();
          this.moveFocusTo("last");
          break;
        case "Enter":
        case " ":
          keyboardEvent.preventDefault();
          this.selectValue(value);
          break;
        default:
          break;
      }
    });
  }

  protected update(): void {
    if (!this.contentEl) {
      return;
    }

    const items = this.items;
    const itemsJson = this.getAttribute("items") ?? "";

    if (!items.length) {
      this.contentEl.innerHTML = `<div part="empty">No items loaded</div>`;
      this.lastItemsJson = itemsJson;
      return;
    }

    const gridEl = this.getGridEl();
    const needsRebuild = !gridEl || itemsJson !== this.lastItemsJson;
    const tabbableValue = this.focusValue ?? (this.valueInternal || items[0]?.value || "");

    if (needsRebuild) {
      this.contentEl.innerHTML = `<div part="grid" role="listbox" aria-label="${escapeHtml(this.label)}">${this.renderTiles(items)}</div>`;
      this.lastItemsJson = itemsJson;
    } else {
      gridEl.setAttribute("aria-label", this.label);
      gridEl.querySelectorAll('[part~="tile"]').forEach(node => {
        const tile = node as HTMLButtonElement;
        const value = tile.dataset.value ?? "";
        const isSelected = value === this.valueInternal;
        tile.setAttribute("part", isSelected ? "tile tile-selected" : "tile");
        tile.setAttribute("aria-selected", String(isSelected));
        tile.tabIndex = value === tabbableValue ? 0 : -1;
      });
    }

    if (this.focusValue) {
      const target = Array.from(this.contentEl.querySelectorAll('[part~="tile"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.focusValue,
      ) as HTMLButtonElement | undefined;
      target?.focus();
    }
  }
}

export const defineBoxGridViewElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxGridViewElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxGridViewElement;
  }

  customElements.define(tagName, BoxGridViewElement);
  return BoxGridViewElement;
};
