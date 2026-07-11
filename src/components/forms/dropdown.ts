const DEFAULT_TAG_NAME = "box-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxDropdownItem = {
  id: string;
  label: string;
};

export class BoxDropdownElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label", "value"];
  }

  private open = false;
  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Dropdown";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxDropdownItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxDropdownItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxDropdownItem[]) {
    this.setAttribute("items", JSON.stringify(value));
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const selectedItem = this.items.find(item => item.id === this.valueInternal) ?? null;
    const triggerLabel = selectedItem?.label ?? this.label;
    const itemsMarkup = this.open
      ? `<div part="menu">${this.items
          .map(
            item => `
              <button
                type="button"
                part="item"
                data-item-id="${escapeHtml(item.id)}"
                data-selected="${String(item.id === this.valueInternal)}"
              >
                ${escapeHtml(item.label)}
              </button>
            `,
          )
          .join("")}</div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="dropdown"] {
          position: relative;
          display: inline-block;
          min-inline-size: 0;
        }

        [part="trigger"] {
          appearance: none;
          font: inherit;
          color: var(--boe-token-text-text, #101820);
          text-align: left;
          padding: 0.6rem 2.35rem 0.6rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.7rem;
          background:
            url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%2352606d' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 0.85rem center / 12px 8px,
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%) 100%
            );
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="trigger"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
        }

        [part="trigger"]:focus-visible {
          outline: none;
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="trigger"][aria-expanded="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="trigger"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part="menu"] {
          position: absolute;
          inset-block-start: calc(100% + 0.35rem);
          inset-inline-start: 0;
          z-index: 20;
          min-inline-size: 100%;
          display: grid;
          gap: 0.15rem;
          padding: 0.35rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.75rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 12px 30px color-mix(in srgb, #0b1e33 14%, transparent);
        }

        [part="item"] {
          appearance: none;
          border: none;
          font: inherit;
          font-weight: 500;
          color: var(--boe-token-text-text, #101820);
          text-align: left;
          white-space: nowrap;
          padding: 0.55rem 0.7rem;
          border-radius: 0.5rem;
          background: transparent;
          cursor: pointer;
          transition:
            background 140ms ease,
            color 140ms ease;
        }

        [part="item"]:hover {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="item"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
          outline-offset: -2px;
        }

        [part="item"][data-selected="true"] {
          background: var(--boe-token-surface-item-surface-selected, #e8f1ff);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }
      </style>
      <div part="dropdown">
        <button
          type="button"
          part="trigger"
          aria-expanded="${String(this.open)}"
          aria-haspopup="menu"
          ${this.disabled ? "disabled" : ""}
        >
          ${escapeHtml(triggerLabel)}
        </button>
        ${itemsMarkup}
      </div>
    `;

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.open = !this.open;
      this.render();
    });

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (this.disabled) {
        return;
      }

      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.open = true;
        this.render();
      }
    });

    this.shadowRoot.querySelectorAll('[part="item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id") ?? "";
        const item = this.items.find(entry => entry.id === itemId);
        if (!item || this.disabled) {
          return;
        }

        this.valueInternal = item.id;
        this.setAttribute("value", item.id);
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: item.id, item },
          }),
        );
        this.open = false;
        this.render();
      });
    });
  }
}

export const defineBoxDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDropdownElement;
  }

  customElements.define(tagName, BoxDropdownElement);
  return BoxDropdownElement;
};
