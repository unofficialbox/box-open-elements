const DEFAULT_TAG_NAME = "box-popover";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxPopoverElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "open"];
  }

  private openValue = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;

    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
    this.render();
  }

  get label(): string {
    return this.getAttribute("label") ?? "Details";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }

    this.render();
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  toggle(): void {
    if (this.openValue) {
      this.hide();
    } else {
      this.show();
    }
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const contentMarkup = this.openValue
      ? `
        <div part="surface" role="dialog">
          <slot></slot>
        </div>
      `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="container"] {
          position: relative;
          display: inline-grid;
          justify-items: start;
          gap: 0.5rem;
        }

        [part="trigger"] {
          appearance: none;
          min-height: 2rem;
          padding: 0.4rem 0.78rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 86%, white 14%);
          border-radius: 0.85rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 20%, var(--boe-token-surface-surface, #ffffff) 80%) 100%
            );
          color: var(--boe-token-text-text, #1f1e1b);
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.74),
            0 10px 22px rgba(15, 23, 42, 0.04);
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="trigger"]:hover {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 48%, white 52%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-item-surface-hover, #eef4fb) 16%) 100%
            );
        }

        [part="trigger"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="surface"] {
          width: min(21rem, calc(100vw - 5rem));
          padding: 0.95rem 1rem 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 86%, white 14%);
          border-radius: 1.1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, var(--boe-token-surface-surface-secondary, #f7f9fc) 18%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
            );
          color: var(--boe-token-text-text, #1f1e1b);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 18px 38px rgba(15, 23, 42, 0.12);
          line-height: 1.5;
        }
      </style>
      <div part="container">
        <button type="button" part="trigger" aria-expanded="${this.openValue ? "true" : "false"}">
          ${escapeHtml(this.label)}
        </button>
        ${contentMarkup}
      </div>
    `;

    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("click", () => {
      this.toggle();
    });
    this.shadowRoot.querySelector('[part="trigger"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.hide();
      }
    });
  }
}

export const defineBoxPopoverElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPopoverElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPopoverElement;
  }

  customElements.define(tagName, BoxPopoverElement);
  return BoxPopoverElement;
};
