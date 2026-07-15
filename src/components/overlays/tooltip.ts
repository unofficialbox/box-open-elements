import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-tooltip";

const tooltipStyles = `
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
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, var(--boe-token-surface-surface, #ffffff) 20%);
    border-radius: 0.75rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 0%,
        color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 14%, var(--boe-token-surface-surface, #ffffff) 86%) 100%
      );
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    padding: 0;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  ${boeNeutralInteractiveStyles('[part="trigger"]')}

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

  [part="tooltip"][hidden] {
    display: none;
  }
`;

export class BoxTooltipElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "open"];
  }

  private openValue = false;
  private tooltipId = `box-tooltip-${Math.random().toString(36).slice(2, 10)}`;
  private triggerEl!: HTMLButtonElement;
  private tooltipEl!: HTMLElement;

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
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${tooltipStyles}</style>
      <span part="container">
        <button type="button" part="trigger">?</button>
        <div id="${this.tooltipId}" part="tooltip" role="tooltip" hidden></div>
      </span>
    `;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.tooltipEl = this.shadowRoot.querySelector('[part="tooltip"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("mouseenter", () => this.show());
    this.triggerEl.addEventListener("mouseleave", () => this.hide());
    this.triggerEl.addEventListener("focus", () => this.show());
    this.triggerEl.addEventListener("blur", () => this.hide());
    // Idempotent show: pointer activation focuses first (which opens), then click
    // must not toggle closed again in the same gesture.
    this.triggerEl.addEventListener("click", () => {
      this.show();
    });
    this.triggerEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.hide();
      }
    });
  }

  protected update(): void {
    if (!this.triggerEl || !this.tooltipEl) {
      return;
    }

    const label = this.label;
    this.triggerEl.setAttribute("aria-label", label);
    this.tooltipEl.textContent = label;
    this.tooltipEl.hidden = !this.openValue;

    if (this.openValue) {
      this.triggerEl.setAttribute("aria-describedby", this.tooltipId);
    } else {
      this.triggerEl.removeAttribute("aria-describedby");
    }
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
