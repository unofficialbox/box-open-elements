import { BaseElement } from "../../core/index.js";
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
} from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-spinner";

const spinnerStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="spinner"] {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  [part="indicator"] {
    display: inline-block;
    flex: none;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    border: 2.5px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, var(--boe-token-surface-surface, #ffffff) 82%);
    border-top-color: var(--boe-token-surface-surface-brand, #0061d5);
    animation: boe-spinner-rotate ${boeMotionDuration.spin} ${boeMotionEasing.linear} infinite;
  }

  @keyframes boe-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  ${boeReducedMotionStyles('[part="indicator"]', "animation-duration: 1.6s;")}

  [part="label"] {
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }
`;

export class BoxSpinnerElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label"];
  }

  private labelEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Loading";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${spinnerStyles}</style>
      <div part="spinner" role="status" aria-live="polite">
        <span part="indicator" aria-hidden="true"></span>
        <span part="label"></span>
      </div>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected update(): void {
    if (!this.labelEl) {
      return;
    }

    this.labelEl.textContent = this.label;
  }
}

export const defineBoxSpinnerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSpinnerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSpinnerElement;
  }

  customElements.define(tagName, BoxSpinnerElement);
  return BoxSpinnerElement;
};
