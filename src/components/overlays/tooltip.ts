import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import {
  parsePlacement,
  trackAnchor,
  type OverlayPlacement,
} from "../../foundations/overlay/index.js";

const DEFAULT_TAG_NAME = "box-tooltip";

export type TooltipTheme = "default" | "error" | "callout";

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
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    padding: 0;
    cursor: pointer;
    box-shadow: none;
  }

  ${boeNeutralInteractiveStyles('[part="trigger"]')}

  /* Positioned by JS (foundations/overlay) as position: fixed, so it escapes
     ancestor overflow and flips/shifts to stay in the viewport. */
  [part="tooltip"] {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 40;
    width: max-content;
    max-width: min(18rem, calc(100vw - 2rem));
    padding: 0.5rem 0.65rem;
    border-radius: ${boeRadius.xlarge};
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, rgba(255, 255, 255, 0.08));
    background: var(--boe-token-surface-tooltip-surface, #4e4e4e);
    color: rgba(255, 255, 255, 0.94);
    box-shadow: 0 16px 28px rgba(16, 24, 32, 0.18);
    line-height: 1.45;
  }

  /* Error theme — for validation hints. */
  [part="tooltip"][data-theme="error"] {
    background: var(--boe-token-surface-status-surface-error, #ed3757);
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
    color: #ffffff;
  }

  /* Callout theme — light surface for richer, longer content. */
  [part="tooltip"][data-theme="callout"] {
    background: var(--boe-token-surface-surface, #ffffff);
    border-color: var(--boe-token-stroke-stroke, #e8e8e8);
    color: var(--boe-token-text-text, #222222);
  }

  [part="tooltip"] ::slotted(img) {
    max-width: 100%;
    border-radius: ${boeRadius.med};
    display: block;
  }

  [part="tooltip"][hidden] {
    display: none;
  }
`;

export class BoxTooltipElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "open", "trigger-label", "placement", "theme"];
  }

  private positionCleanup: (() => void) | null = null;

  private openValue = false;
  private tooltipId = `box-tooltip-${Math.random().toString(36).slice(2, 10)}`;
  private triggerHostEl!: HTMLElement;
  private triggerSlot!: HTMLSlotElement;
  private fallbackTriggerEl!: HTMLButtonElement;
  private tooltipEl!: HTMLElement;
  private labelEl!: HTMLElement;
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

  get placement(): string {
    return this.getAttribute("placement") ?? "bottom-center";
  }

  set placement(value: string) {
    this.setAttribute("placement", value);
  }

  private resolvedPlacement(): OverlayPlacement {
    return parsePlacement(this.getAttribute("placement")) ?? { side: "bottom", align: "center" };
  }

  get theme(): TooltipTheme {
    const value = this.getAttribute("theme");
    return value === "error" || value === "callout" ? value : "default";
  }

  set theme(value: TooltipTheme) {
    this.setAttribute("theme", value);
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
        <div id="${this.tooltipId}" part="tooltip" role="tooltip" hidden><span part="label"></span><slot name="content"></slot></div>
      </span>
    `;
    this.triggerHostEl = this.shadowRoot.querySelector('[part="trigger-host"]')!;
    this.triggerSlot = this.shadowRoot.querySelector("slot:not([name])")!;
    this.fallbackTriggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.tooltipEl = this.shadowRoot.querySelector('[part="tooltip"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
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

    this.labelEl.textContent = this.label;
    const theme = this.theme;
    if (theme === "default") {
      this.tooltipEl.removeAttribute("data-theme");
    } else {
      this.tooltipEl.setAttribute("data-theme", theme);
    }
    this.tooltipEl.hidden = !this.openValue;

    const trigger = this.resolveDescribedTrigger();
    if (trigger === this.fallbackTriggerEl) {
      this.fallbackTriggerEl.setAttribute("aria-label", this.triggerLabel);
    }

    this.clearDescribedBy();
    this.stopTracking();
    if (this.openValue) {
      trigger.setAttribute("aria-describedby", this.tooltipId);
      this.describedTrigger = trigger;
      // Position as a fixed-coordinate overlay so it escapes ancestor overflow
      // and flips/shifts to stay on-screen.
      this.positionCleanup = trackAnchor(this.triggerHostEl, this.tooltipEl, {
        placement: this.resolvedPlacement(),
        offset: 8,
      });
    }
  }

  private stopTracking(): void {
    this.positionCleanup?.();
    this.positionCleanup = null;
  }

  disconnectedCallback(): void {
    this.stopTracking();
    super.disconnectedCallback?.();
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
