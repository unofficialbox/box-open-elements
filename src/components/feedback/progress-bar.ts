import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-progress-bar";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const progressBarStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="progress"] {
    display: grid;
    gap: 0.45rem;
  }

  [part="meta"] {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.65rem;
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  /* Fully hidden rather than the sr-only clip the form fields use. There the
     label element *is* the control's accessible name, so it has to stay
     readable; here the name lives on [part="track"]'s aria-label, and leaving
     a clipped copy behind would just make a screen reader read it twice. */
  :host([hide-label]) [part="label"] {
    display: none;
  }

  [part="value"] {
    font-size: 0.86rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--boe-token-text-text, #222222);
  }

  [part="track"] {
    display: block;
    height: 0.5rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%);
    overflow: hidden;
  }

  [part="indicator"] {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    transition: width ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }
`;

export class ProgressBar extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["hide-label", "label", "max", "value"];
  }

  private progressEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private valueEl!: HTMLElement;
  private trackEl!: HTMLElement;
  private indicatorEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Progress";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  /**
   * Keep the label as the bar's accessible name but drop it from the layout.
   *
   * For a bar sitting under something that already names it — an upload row
   * showing the filename above it — the visible label is a second copy of text
   * the reader can already see.
   */
  get hideLabel(): boolean {
    return this.hasAttribute("hide-label");
  }

  set hideLabel(value: boolean) {
    this.toggleAttribute("hide-label", Boolean(value));
  }

  get max(): number {
    return Number(this.getAttribute("max") ?? "100");
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
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
      <style>${progressBarStyles}</style>
      <div part="progress">
        <div part="meta">
          <span part="label"></span>
          <span part="value"></span>
        </div>
        <div part="track" role="progressbar" aria-valuemin="0">
          <span part="indicator"></span>
        </div>
      </div>
    `;
    this.progressEl = this.shadowRoot.querySelector('[part="progress"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.trackEl = this.shadowRoot.querySelector('[part="track"]')!;
    this.indicatorEl = this.shadowRoot.querySelector('[part="indicator"]')!;
  }

  protected update(): void {
    if (!this.progressEl) {
      return;
    }

    const max = Math.max(1, this.max);
    const value = clamp(this.value, 0, max);
    const percentage = Math.round((value / max) * 100);

    // The name belongs to [part="track"] — the element carrying the
    // progressbar role — and to nothing else. The wrapper used to be a
    // role="group" named `${label} progress`, which both duplicated that name
    // and stuttered: the default label is "Progress", so it announced
    // "Progress progress", and the uploader's "<file> upload progress" became
    // "<file> upload progress progress".
    this.labelEl.textContent = this.label;
    this.valueEl.textContent = `${percentage}%`;
    this.trackEl.setAttribute("aria-label", this.label);
    this.trackEl.setAttribute("aria-valuemax", String(max));
    this.trackEl.setAttribute("aria-valuenow", String(value));
    this.trackEl.setAttribute("aria-valuetext", `${percentage}%`);
    this.indicatorEl.style.width = `${percentage}%`;
  }
}

ProgressBar.register();
