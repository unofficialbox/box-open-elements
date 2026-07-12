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

/**
 * A grid/gallery view mode for a collection, alongside `list` and `table`. Items
 * arrive as a `items` property (data in); single selection is exposed as `value`
 * and announced with a `value-changed` event (interaction out). Tiles form a
 * listbox: one tile is tabbable (roving `tabindex`), arrow keys move focus, and
 * Enter/Space or click selects. It owns no transport.
 */
export class BoxGridViewElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";
  private focusValue: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    this.render();
  }

  private selectValue(value: string): void {
    if (!value || value === this.valueInternal) {
      return;
    }

    this.valueInternal = value;
    this.setAttribute("value", value);
    this.focusValue = value;
    this.render();
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
      this.render();
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
      this.render();
    }
  }

  private renderTiles(items: BoxGridViewItem[]): string {
    // The tabbable tile is the selected one, else the roving focus target, else
    // the first — so the grid always has exactly one entry point for the keyboard.
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const items = this.items;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="grid"] {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
          gap: 0.75rem;
        }

        [part~="tile"] {
          appearance: none;
          display: grid;
          justify-items: center;
          gap: 0.5rem;
          padding: 1rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 0.85rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #101820);
          font: inherit;
          text-align: center;
          cursor: pointer;
          transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
        }

        [part~="tile"]:hover {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part~="tile-selected"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, white 90%);
        }

        [part~="tile"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="thumb"] {
          display: grid;
          place-items: center;
          inline-size: 2.75rem;
          block-size: 2.75rem;
          border-radius: 0.6rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 82%, white 18%);
          color: var(--boe-token-text-text-secondary, #52606d);
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
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="empty"] {
          padding: 1.5rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.9rem;
        }
      </style>
      ${
        items.length
          ? `<div part="grid" role="listbox" aria-label="${escapeHtml(this.label)}">${this.renderTiles(items)}</div>`
          : `<div part="empty">No items loaded</div>`
      }
    `;

    for (const tile of Array.from(this.shadowRoot.querySelectorAll('[part~="tile"]'))) {
      tile.addEventListener("click", () => {
        this.selectValue((tile as HTMLButtonElement).dataset.value ?? "");
      });

      tile.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const value = (tile as HTMLButtonElement).dataset.value ?? "";

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

    if (this.focusValue) {
      const target = Array.from(this.shadowRoot.querySelectorAll('[part~="tile"]')).find(
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
