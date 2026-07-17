import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-badge";

const badgeStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="badge"] {
    display: inline-block;
    padding: 2px 4px 3px;
    border-radius: ${boeRadius.size};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
    font-size: 10px;
    font-weight: 700;
    line-height: 12px;
    letter-spacing: 0;
    text-align: center;
    text-transform: none;
    text-decoration: none;
    white-space: nowrap;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="badge"][data-tone="neutral"] {
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
  }

  [part="badge"][data-tone="info"],
  [part="badge"][data-tone="brand"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, #fff);
    color: #ffffff;
  }

  [part="badge"][data-tone="success"] {
    background: var(--boe-token-surface-status-surface-success, #26c281);
    color: #ffffff;
  }

  [part="badge"][data-tone="error"] {
    background: var(--boe-token-surface-status-surface-error, #ed3757);
    color: #ffffff;
  }

  [part="badge"][data-tone="warning"],
  [part="badge"][data-tone="inprogress"] {
    background: var(--boe-token-surface-status-surface-inprogress, #f5b31b);
    color: #ffffff;
  }
`;

export class BoxBadgeElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "tone"];
  }

  private badgeEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${badgeStyles}</style>
      <span part="badge" role="status"></span>
    `;
    this.badgeEl = this.shadowRoot.querySelector('[part="badge"]')!;
  }

  protected update(): void {
    if (!this.badgeEl) {
      return;
    }

    this.badgeEl.dataset.tone = this.tone;
    this.badgeEl.setAttribute("aria-label", this.label);
    this.badgeEl.textContent = this.label;
  }
}

export const defineBoxBadgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBadgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBadgeElement;
  }

  customElements.define(tagName, BoxBadgeElement);
  return BoxBadgeElement;
};
