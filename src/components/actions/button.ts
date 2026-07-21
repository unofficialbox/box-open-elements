import { BaseElement } from "../../core/index.js";
import { boeControl, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-button";

/**
 * Visual language tracks box-ui-elements `.btn` / `.btn-primary`
 * (`src/styles/common/_buttons.scss` + constants/_buttons.scss).
 * Default tone remains `primary` for API stability; `neutral` is the
 * secondary/bordered BUE default look.
 */
const buttonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  button {
    appearance: none;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${boeSpace[2]};
    min-height: ${boeControl.height};
    padding: 0 ${boeControl.paddingInline};
    font-family: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    line-height: 1;
    letter-spacing: ${boeControl.letterSpacing};
    white-space: nowrap;
    border-radius: ${boeRadius.control};
    border: 1px solid var(--boe-token-surface-surface-brand, #0061d5);
    cursor: pointer;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
    box-shadow: none;
    transition:
      background-color ${boeMotionDuration.fast} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.fast} ${boeMotionEasing.standard},
      color ${boeMotionDuration.fast} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.fast} ${boeMotionEasing.standard};
  }

  button:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
    border-color: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  button:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eac);
    border-color: var(--boe-token-surface-surface-brand-pressed, #004eac);
    box-shadow: none;
  }

  button:focus-visible {
    outline: none;
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: ${boeControl.primaryFocusShadow};
  }

  button[data-tone="neutral"] {
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    border-color: ${boeControl.buttonBorder};
    box-shadow: none;
  }

  button[data-tone="neutral"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 97%, black 3%);
    border-color: ${boeControl.buttonBorder};
  }

  button[data-tone="neutral"]:active:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, black 8%);
    border-color: ${boeControl.buttonBorder};
  }

  button[data-tone="neutral"]:focus-visible {
    border-color: var(--boe-token-text-text, #222222);
    box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
  }

  button[data-tone="danger"] {
    background: var(--boe-token-surface-status-surface-error, #ed3757);
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  button[data-tone="danger"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 92%, white 8%);
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 92%, white 8%);
  }

  button[data-tone="danger"]:active:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 88%, black 12%);
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 88%, black 12%);
  }

  button[data-tone="danger"]:focus-visible {
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 80%), 0 1px 2px rgb(0 0 0 / 10%);
  }

  button[data-size="small"] {
    min-height: 28px;
    padding: 0 ${boeSpace[3]};
    font-size: 12px;
    border-radius: ${boeRadius.control};
  }

  button[data-size="large"] {
    min-height: ${boeControl.heightLarge};
    padding: 0 ${boeSpace[5]};
  }

  button:disabled {
    cursor: default;
    opacity: ${boeControl.disabledOpacity};
    box-shadow: none;
  }

  button[aria-busy="true"] {
    cursor: default;
  }

  /* Leading icon slot — hidden when nothing is slotted (kept off the flex gap). */
  [part="icon"] {
    display: inline-flex;
    width: 16px;
    height: 16px;
  }

  [part="icon"][hidden] {
    display: none;
  }

  [part="icon"] ::slotted(svg) {
    width: 16px;
    height: 16px;
  }

  /* Inline loading spinner, shown while is-loading. */
  [part="spinner"] {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: boe-btn-spin 0.7s linear infinite;
  }

  [part="spinner"][hidden] {
    display: none;
  }

  @keyframes boe-btn-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    [part="spinner"] { animation-duration: 1.6s; }
  }
`;

export type ButtonType = "button" | "submit" | "reset";

export class BoxButtonElement extends BaseElement {
  static formAssociated = true;

  static get observedAttributes(): string[] {
    return ["disabled", "label", "size", "tone", "is-loading", "type"];
  }

  private buttonEl!: HTMLButtonElement;
  private spinnerEl!: HTMLElement;
  private iconEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private iconSlot!: HTMLSlotElement;
  private readonly internals: ElementInternals;

  constructor() {
    super();
    // Form association lets type="submit"/"reset" drive the owning form.
    this.internals = this.attachInternals();
  }

  /** Loading state: shows a spinner and blocks activation (stays focusable). */
  get isLoading(): boolean {
    return this.hasAttribute("is-loading");
  }

  set isLoading(value: boolean) {
    this.toggleAttribute("is-loading", Boolean(value));
  }

  get type(): ButtonType {
    const type = this.getAttribute("type");
    return type === "submit" || type === "reset" ? type : "button";
  }

  set type(value: ButtonType) {
    this.setAttribute("type", value);
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
    return this.getAttribute("label") ?? "Button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get size(): string {
    return this.getAttribute("size") ?? "medium";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "primary";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${buttonStyles}</style>
      <button type="button" part="button">
        <span part="spinner" aria-hidden="true" hidden></span>
        <span part="icon" hidden><slot name="icon"></slot></span>
        <span part="label"></span>
      </button>
    `;
    this.buttonEl = this.shadowRoot.querySelector('[part="button"]')!;
    this.spinnerEl = this.shadowRoot.querySelector('[part="spinner"]')!;
    this.iconEl = this.shadowRoot.querySelector('[part="icon"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.iconSlot = this.iconEl.querySelector("slot")!;
  }

  protected setupListeners(): void {
    this.buttonEl.addEventListener("click", event => {
      if (this.disabled || this.isLoading) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      // Drive the owning form for submit/reset (custom elements don't do this
      // natively). Prefer the form-associated form; fall back to the nearest
      // ancestor form so it works without full ElementInternals.form support.
      const form = this.internals.form ?? this.closest("form");
      if (this.type === "submit") {
        form?.requestSubmit();
      } else if (this.type === "reset") {
        form?.reset();
      }
    });

    this.iconSlot.addEventListener("slotchange", () => this.syncIconVisibility());
  }

  private syncIconVisibility(): void {
    this.iconEl.hidden = this.iconSlot.assignedNodes({ flatten: true }).length === 0;
  }

  protected update(): void {
    if (!this.buttonEl) {
      return;
    }

    this.buttonEl.dataset.tone = this.tone;
    this.buttonEl.dataset.size = this.size;
    this.labelEl.textContent = this.label;

    const busy = this.isLoading;
    this.spinnerEl.hidden = !busy;
    this.buttonEl.setAttribute("aria-busy", String(busy));

    // A loading button stays focusable but inert; a disabled one is fully off.
    if (this.disabled) {
      this.buttonEl.setAttribute("disabled", "");
    } else {
      this.buttonEl.removeAttribute("disabled");
    }
    this.buttonEl.setAttribute("aria-disabled", String(this.disabled || busy));

    this.syncIconVisibility();
  }
}

export const defineBoxButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxButtonElement;
  }

  customElements.define(tagName, BoxButtonElement);
  return BoxButtonElement;
};
