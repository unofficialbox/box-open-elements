const DEFAULT_TAG_NAME = "box-menu";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxMenuItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export class BoxMenuElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label"];
  }

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
    return this.getAttribute("label") ?? "Menu";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxMenuItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxMenuItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxMenuItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const itemsMarkup = this.items
      .map(
        item => `
          <button type="button" part="menu-item" role="menuitem" data-item-id="${escapeHtml(item.id)}" ${this.disabled || item.disabled ? "disabled" : ""}>
            ${escapeHtml(item.label)}
          </button>
        `,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="menu"] {
          min-width: 11rem;
          margin: 0;
          padding: 0.45rem;
          display: grid;
          gap: 0.2rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, white 16%);
          border-radius: 0.75rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 12px 30px color-mix(in srgb, #0b1e33 14%, transparent);
        }

        [part="menu-item"] {
          width: 100%;
          appearance: none;
          text-align: left;
          border: 0;
          border-radius: 0.6rem;
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.92rem;
          padding: 0.6rem 0.7rem;
          cursor: pointer;
          transition:
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="menu-item"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="menu-item"]:active:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 64%, white 36%);
        }

        [part="menu-item"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="menu-item"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      </style>
      <div part="menu" role="menu" aria-label="${escapeHtml(this.label)}">
        ${itemsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="menu-item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        const item = this.items.find(entry => entry.id === itemId);
        if (!item || this.disabled || item.disabled) {
          return;
        }

        this.dispatchEvent(
          new CustomEvent("item-selected", {
            bubbles: true,
            composed: true,
            detail: item,
          }),
        );
      });
    });
  }
}

export const defineBoxMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMenuElement;
  }

  customElements.define(tagName, BoxMenuElement);
  return BoxMenuElement;
};
