import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-progress-ring";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const progressRingStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="ring"] {
    display: inline-grid;
    place-items: center;
  }

  [part="svg"] {
    grid-area: 1 / 1;
    transform: rotate(-90deg);
  }

  circle[part="track"] {
    stroke: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%);
  }

  circle[part="indicator"] {
    stroke: var(--boe-token-surface-surface-brand, #0061d5);
    stroke-linecap: round;
    transition: stroke-dashoffset ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="meta"] {
    grid-area: 1 / 1;
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    text-align: center;
  }

  [part="value"] {
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: var(--boe-token-text-text, #222222);
  }

  [part="label"] {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }
`;

export class BoxProgressRingElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "max", "size", "value"];
  }

  private ringEl!: HTMLElement;
  private svgEl!: SVGSVGElement;
  private trackCircle!: SVGCircleElement;
  private indicatorCircle!: SVGCircleElement;
  private valueEl!: HTMLElement;
  private labelEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Progress";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    return Number(this.getAttribute("max") ?? "100");
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get size(): number {
    return Number(this.getAttribute("size") ?? "88");
  }

  set size(value: number) {
    this.setAttribute("size", String(value));
  }

  get value(): number {
    return Number(this.getAttribute("value") ?? "0");
  }

  set value(value: number) {
    this.setAttribute("value", String(value));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${progressRingStyles}</style>
      <div part="ring" role="group">
        <svg part="svg" role="progressbar" aria-valuemin="0">
          <circle part="track" fill="none"></circle>
          <circle part="indicator" fill="none"></circle>
        </svg>
        <div part="meta">
          <span part="value"></span>
          <span part="label"></span>
        </div>
      </div>
    `;
    this.ringEl = this.shadowRoot.querySelector('[part="ring"]')!;
    this.svgEl = this.shadowRoot.querySelector('[part="svg"]')!;
    this.trackCircle = this.shadowRoot.querySelector('circle[part="track"]')!;
    this.indicatorCircle = this.shadowRoot.querySelector('circle[part="indicator"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected update(): void {
    if (!this.ringEl) {
      return;
    }

    const max = Math.max(1, this.max);
    const value = clamp(this.value, 0, max);
    const percentage = Math.round((value / max) * 100);
    const size = Math.max(48, this.size);
    const strokeWidth = Math.max(6, Math.round(size * 0.09));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentage / 100) * circumference;
    const center = String(size / 2);

    this.ringEl.setAttribute("aria-label", `${this.label} progress`);
    this.svgEl.setAttribute("viewBox", `0 0 ${size} ${size}`);
    this.svgEl.style.width = `${size}px`;
    this.svgEl.style.height = `${size}px`;
    this.svgEl.setAttribute("aria-label", this.label);
    this.svgEl.setAttribute("aria-valuemax", String(max));
    this.svgEl.setAttribute("aria-valuenow", String(value));
    this.svgEl.setAttribute("aria-valuetext", `${percentage}%`);

    for (const circle of [this.trackCircle, this.indicatorCircle]) {
      circle.setAttribute("cx", center);
      circle.setAttribute("cy", center);
      circle.setAttribute("r", String(radius));
      circle.setAttribute("stroke-width", String(strokeWidth));
    }

    this.indicatorCircle.setAttribute("stroke-dasharray", String(circumference));
    this.indicatorCircle.setAttribute("stroke-dashoffset", String(dashOffset));
    this.valueEl.style.fontSize = `${Math.max(0.8, size / 88)}rem`;
    this.valueEl.textContent = `${percentage}%`;
    this.labelEl.textContent = this.label;
  }
}

export const defineBoxProgressRingElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxProgressRingElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxProgressRingElement;
  }

  customElements.define(tagName, BoxProgressRingElement);
  return BoxProgressRingElement;
};
