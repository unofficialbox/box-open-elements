import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-tooltip";

const DEFAULT_TRIGGER_LABEL = "More information";

const tooltipStyles = `
  :host {
    display: inline-block;
    position: relative;
    color: inherit;
    font: inherit;
  }

  [part="container"] {
    display: inline-grid;
  }

  [part="trigger-host"] {
    display: inline-grid;
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
    position: absolute;
    inset-block-start: calc(100% + 0.5rem);
    inset-inline-start: 50%;
    transform: translateX(-50%);
    z-index: 1;
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
    return ["label", "open", "trigger-label"];
  }

  private openValue = false;
  private tooltipId = `box-tooltip-${Math.random().toString(36).slice(2, 10)}`;
  private triggerHostEl!: HTMLElement;
  private triggerSlot!: HTMLSlotElement;
  private fallbackTriggerEl!: HTMLButtonElement;
  private tooltipEl!: HTMLElement;
  private describedTrigger: HTMLElement | null = null;

  get label(): string {
    return this.getAttribute("label") ?? "Helpful context";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get triggerLabel(): string {
    return this.getAttribute("trigger-label") ?? DEFAULT_TRIGGER_LABEL;
  }

  set triggerLabel(value: string) {
    this.setAttribute("trigger-label", value);
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

  private resolveDescribedTrigger(): HTMLElement {
    const slotted = this.triggerSlot.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!slotted) {
      return this.fallbackTriggerEl;
    }

    const nestedFocusable = slotted.matches("button, a[href], input, select, textarea, [tabindex]")
      ? slotted
      : (slotted.querySelector<HTMLElement>("button, a[href], input, select, textarea, [tabindex]") ?? null);
    return nestedFocusable ?? slotted;
  }

  private clearDescribedBy(): void {
    if (this.describedTrigger?.hasAttribute("aria-describedby")) {
      this.describedTrigger.removeAttribute("aria-describedby");
    }
    this.describedTrigger = null;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${tooltipStyles}</style>
      <span part="container">
        <span part="trigger-host">
          <slot><button type="button" part="trigger">?</button></slot>
        </span>
        <div id="${this.tooltipId}" part="tooltip" role="tooltip" hidden></div>
      </span>
    `;
    this.triggerHostEl = this.shadowRoot.querySelector('[part="trigger-host"]')!;
    this.triggerSlot = this.shadowRoot.querySelector("slot")!;
    this.fallbackTriggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.tooltipEl = this.shadowRoot.querySelector('[part="tooltip"]')!;
  }

  protected setupListeners(): void {
    this.triggerHostEl.addEventListener("mouseenter", () => this.show());
    this.triggerHostEl.addEventListener("mouseleave", () => this.hide());
    this.triggerHostEl.addEventListener("focusin", () => this.show());
    this.triggerHostEl.addEventListener("focusout", event => {
      const next = (event as FocusEvent).relatedTarget as Node | null;
      // Slotted light-DOM nodes are not descendants of the shadow trigger host.
      if (next && (this.triggerHostEl.contains(next) || this.contains(next))) {
        return;
      }
      this.hide();
    });
    // Idempotent show: pointer activation focuses first (which opens), then click
    // must not toggle closed again in the same gesture.
    this.triggerHostEl.addEventListener("click", () => {
      this.show();
    });
    this.triggerHostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.hide();
      }
    });
    this.triggerSlot.addEventListener("slotchange", () => {
      if (this.isRendered) {
        this.update();
      }
    });
  }

  protected update(): void {
    if (!this.triggerHostEl || !this.tooltipEl || !this.triggerSlot) {
      return;
    }

    const label = this.label;
    this.tooltipEl.textContent = label;
    this.tooltipEl.hidden = !this.openValue;

    const trigger = this.resolveDescribedTrigger();
    if (trigger === this.fallbackTriggerEl) {
      this.fallbackTriggerEl.setAttribute("aria-label", this.triggerLabel);
    }

    this.clearDescribedBy();
    if (this.openValue) {
      trigger.setAttribute("aria-describedby", this.tooltipId);
      this.describedTrigger = trigger;
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
