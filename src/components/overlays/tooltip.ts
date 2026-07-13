const DEFAULT_TAG_NAME = "box-tooltip";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxTooltipElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "open"];
  }

  private openValue = false;

  private tooltipId = `box-tooltip-${Math.random().toString(36).slice(2, 10)}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Helpful context";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextValue = Boolean(value);
    if (this.openValue === nextValue) {
      return;
    }

    this.openValue = nextValue;
    if (nextValue) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextValue } }));
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const tooltipMarkup = this.openValue
      ? `<div id="${this.tooltipId}" part="tooltip" role="tooltip">${escapeHtml(this.label)}</div>`
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
          gap: 0.5rem;
        }

        [part="trigger"] {
          width: 1.7rem;
          height: 1.7rem;
          display: inline-grid;
          place-items: center;
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, white 20%);
          border-radius: 0.75rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, white 8%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 14%, var(--boe-token-surface-surface, #ffffff) 86%) 100%
            );
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          padding: 0;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }

        [part="trigger"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="tooltip"] {
          width: min(13.75rem, calc(100vw - 6rem));
          padding: 0.65rem 0.8rem;
          border-radius: 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, rgba(255, 255, 255, 0.08));
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-tooltip-surface, #222222) 88%, var(--boe-token-surface-surface-brand, #0061d5) 12%) 0%,
              var(--boe-token-surface-tooltip-surface, #222222) 100%
            );
          color: rgba(255, 255, 255, 0.94);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 16px 28px rgba(16, 24, 32, 0.18);
          line-height: 1.45;
        }
      </style>
      <span part="container">
        <button
          type="button"
          part="trigger"
          aria-label="${escapeHtml(this.label)}"
          ${this.openValue ? `aria-describedby="${this.tooltipId}"` : ""}
        >?</button>
        ${tooltipMarkup}
      </span>
    `;

    const trigger = this.shadowRoot.querySelector('[part="trigger"]');
    trigger?.addEventListener("mouseenter", () => this.show());
    trigger?.addEventListener("mouseleave", () => this.hide());
    trigger?.addEventListener("focus", () => this.show());
    trigger?.addEventListener("blur", () => this.hide());
    trigger?.addEventListener("click", () => {
      if (this.openValue) {
        this.hide();
      } else {
        this.show();
      }
    });
    trigger?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.hide();
      }
    });
  }
}

export const defineBoxTooltipElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTooltipElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTooltipElement;
  }

  customElements.define(tagName, BoxTooltipElement);
  return BoxTooltipElement;
};
