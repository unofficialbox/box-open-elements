import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buttonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.45em 1em;
    border-radius: 0.75rem;
    border: 1px solid transparent;
    cursor: pointer;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface-brand, #0061d5) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, #003c86 12%) 100%
      );
    color: var(--boe-token-text-text-on-brand, #ffffff);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 1px 2px rgba(15, 23, 42, 0.08);
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  button:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #0057c0);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 6px 14px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, transparent);
  }

  button:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eaa);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  button[data-tone="neutral"] {
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface-secondary, #fbfbfb) 6%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
      );
    color: var(--boe-token-text-text, #222222);
    border-color: var(--boe-token-stroke-stroke, #e8e8e8);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 1px 2px rgba(15, 23, 42, 0.04);
  }

  button[data-tone="neutral"]:hover:not(:disabled),
  button[data-tone="neutral"]:active:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  button[data-tone="neutral"]:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  button[data-tone="danger"] {
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-status-surface-error, #ed3757) 0%,
        color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 88%, #9c1230 12%) 100%
      );
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  button[data-tone="danger"]:hover:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 90%, var(--boe-token-surface-surface, #ffffff) 10%);
  }

  button[data-tone="danger"]:active:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 84%, black 16%);
  }

  button[data-tone="danger"]:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 22%, transparent);
  }

  button[data-size="small"] {
    padding: 0.35em 0.8em;
    font-size: 0.875em;
    border-radius: 0.6rem;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
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
