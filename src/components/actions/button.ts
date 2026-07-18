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
`;

export class BoxButtonElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "size", "tone"];
  }

  private buttonEl!: HTMLButtonElement;

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
      <button type="button" part="button"></button>
    `;
    this.buttonEl = this.shadowRoot.querySelector('[part="button"]')!;
  }

  protected update(): void {
    if (!this.buttonEl) {
      return;
    }

    this.buttonEl.dataset.tone = this.tone;
    this.buttonEl.dataset.size = this.size;
    if (this.disabled) {
      this.buttonEl.setAttribute("disabled", "");
    } else {
      this.buttonEl.removeAttribute("disabled");
    }
    this.buttonEl.textContent = this.label;
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
