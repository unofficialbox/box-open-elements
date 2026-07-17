import { BaseElement } from "../../core/index.js";
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
} from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-skeleton";

const skeletonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="skeleton"] {
    border-radius: 0.5rem;
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 50%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 100%
      );
    background-size: 200% 100%;
    animation: boe-skeleton-shimmer ${boeMotionDuration.shimmer} ${boeMotionEasing.standard} infinite;
  }

  @keyframes boe-skeleton-shimmer {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -100% 0;
    }
  }

  ${boeReducedMotionStyles('[part="skeleton"]', "animation: none;")}
`;

export class BoxSkeletonElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["height", "width"];
  }

  private skeletonEl!: HTMLElement;
  private appliedWidth = "";
  private appliedHeight = "";

  get width(): string {
    return this.getAttribute("width") ?? "100%";
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return this.getAttribute("height") ?? "16px";
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${skeletonStyles}</style>
      <span part="skeleton" style="display:inline-block;" aria-hidden="true"></span>
    `;
    this.skeletonEl = this.shadowRoot.querySelector('[part="skeleton"]')!;
    this.appliedWidth = "";
    this.appliedHeight = "";
  }

  protected update(): void {
    if (!this.skeletonEl) {
      return;
    }

    // Apply size via the CSSOM, not string interpolation: setProperty validates
    // the value and silently drops anything invalid, so attribute-supplied
    // width/height can't break out of the style attribute and inject markup.
    // Skip per-dimension when unchanged to avoid redundant CSSOM writes.
    const nextWidth = this.width;
    const nextHeight = this.height;
    if (nextWidth !== this.appliedWidth) {
      this.skeletonEl.style.setProperty("width", nextWidth);
      this.appliedWidth = nextWidth;
    }
    if (nextHeight !== this.appliedHeight) {
      this.skeletonEl.style.setProperty("height", nextHeight);
      this.appliedHeight = nextHeight;
    }
  }
}

export const defineBoxSkeletonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSkeletonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSkeletonElement;
  }

  customElements.define(tagName, BoxSkeletonElement);
  return BoxSkeletonElement;
};
