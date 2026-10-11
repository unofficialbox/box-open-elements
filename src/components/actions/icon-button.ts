import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIcon,
} from "../../foundations/tokens/registry.js";
import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-icon-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const iconButtonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="button"] {
    appearance: none;
    width: 2rem;
    height: 2rem;
    display: inline-grid;
    place-items: center;
    padding: 0;
    font: inherit;
    border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="button"][data-size="small"] {
    box-sizing: border-box;
    width: 1.5rem;
    height: 1.5rem;
  }

  [part="button"]:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, var(--boe-token-stroke-stroke, #e8e8e8) 72%);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="button"]:active:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
  }

  [part="button"][data-tone="primary"] {
    border-color: transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="button"][data-tone="primary"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="button"][data-tone="primary"]:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eac);
  }

  [part="button"][data-tone="danger"] {
    border-color: transparent;
    background: var(--boe-token-surface-status-surface-error, #ed3757);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="button"][data-tone="danger"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 90%, var(--boe-token-surface-surface, #ffffff) 10%);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="button"][data-variant="quiet"] {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="button"][data-variant="quiet"][data-tone="primary"],
  [part="button"][data-variant="quiet"][data-tone="primary"]:hover:not(:disabled) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="button"][data-variant="quiet"][data-tone="danger"],
  [part="button"][data-variant="quiet"][data-tone="danger"]:hover:not(:disabled) {
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  [part="button"][data-variant="quiet"]:hover:not(:disabled) {
    background: color-mix(in srgb, currentColor 10%, transparent);
    border-color: currentColor;
  }

  [part="button"][data-variant="quiet"]:active:not(:disabled) {
    background: color-mix(in srgb, currentColor 18%, transparent);
  }

  [part="button"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="button"][data-variant="quiet"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 2px;
  }

  [part="button"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  [part="icon"] {
    display: inline-grid;
    place-items: center;
    font-size: 1rem;
    line-height: 1;
  }

  [part="icon"] svg,
  [part="icon"] ::slotted(svg) {
    width: 1.1em;
    height: 1.1em;
    display: block;
    fill: currentColor;
  }
`;

export class IconButton extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  private readonly handleDesignSystemChange = (): void => {
    if (this.isRendered) {
      this.update();
    }
  };

  static get observedAttributes(): string[] {
    return ["disabled", "icon", "label", "tone", "size", "variant"];
  }

  private buttonEl!: HTMLButtonElement;
  private iconEl!: HTMLElement;
  private iconSlot!: HTMLSlotElement;
  private fallbackIconEl!: HTMLElement;

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

  get icon(): string {
    return this.getAttribute("icon") ?? "•";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Icon button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "secondary";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  get size(): string {
    return this.getAttribute("size") ?? "medium";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  get variant(): string {
    return this.getAttribute("variant") ?? "default";
  }

  set variant(value: string) {
    this.setAttribute("variant", value);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${iconButtonStyles}</style>
      <button type="button" part="button">
        <span part="icon" aria-hidden="true"><slot name="icon"><span data-icon-fallback></span></slot></span>
      </button>
    `;
    this.buttonEl = this.shadowRoot.querySelector('[part="button"]')!;
    this.iconEl = this.shadowRoot.querySelector('[part="icon"]')!;
    this.iconSlot = this.shadowRoot.querySelector('slot[name="icon"]')!;
    this.fallbackIconEl = this.shadowRoot.querySelector('[data-icon-fallback]')!;
    this.iconSlot.addEventListener("slotchange", () => this.update());
  }

  protected update(): void {
    if (!this.buttonEl || !this.iconEl) {
      return;
    }

    const resolvedIcon = resolveDesignIcon(this.icon);
    const iconMarkup = resolvedIcon ?? escapeHtml(this.icon);

    this.buttonEl.setAttribute("aria-label", this.label);
    this.buttonEl.setAttribute("title", this.label);
    this.buttonEl.dataset.tone = this.tone;
    this.buttonEl.dataset.size = this.size;
    this.buttonEl.dataset.variant = this.variant;
    if (this.disabled) {
      this.buttonEl.setAttribute("disabled", "");
    } else {
      this.buttonEl.removeAttribute("disabled");
    }

    this.iconEl.dataset.iconSource = this.iconSlot.assignedNodes().length
      ? "slot"
      : resolvedIcon ? "design-system" : "text";
    this.fallbackIconEl.innerHTML = iconMarkup;
  }
}

IconButton.register();
