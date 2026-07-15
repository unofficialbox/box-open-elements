const DEFAULT_TAG_NAME = "box-menu-item";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxMenuItemElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "selected", "value"];
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
    return this.getAttribute("label") ?? "Menu Item";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    if (value) {
      this.setAttribute("selected", "");
    } else {
      this.removeAttribute("selected");
    }
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

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="item"] {
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

        [part="item"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item"][data-selected="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 64%, var(--boe-token-surface-surface, #ffffff) 36%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, var(--boe-token-text-text, #222222) 20%);
          font-weight: 600;
        }

        [part="item"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="item"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      </style>
      <button
        type="button"
        part="item"
        role="menuitemradio"
        data-selected="${String(this.selected)}"
        aria-checked="${String(this.selected)}"
        aria-disabled="${String(this.disabled)}"
        ${this.disabled ? "disabled" : ""}
      >
        ${escapeHtml(this.label)}
      </button>
    `;

    this.shadowRoot.querySelector('[part="item"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.dispatchEvent(
        new CustomEvent("selected", {
          bubbles: true,
          composed: true,
          detail: { value: this.value, label: this.label },
        }),
      );
    });
  }
}

export const defineBoxMenuItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMenuItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMenuItemElement;
  }

  customElements.define(tagName, BoxMenuItemElement);
  return BoxMenuItemElement;
};
