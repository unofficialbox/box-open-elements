import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-range-slider";

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type RangeValue = {
  end: number;
  start: number;
};

const rangeSliderStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: grid;
    gap: 0.6rem;
  }

  [part="header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="value"] {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  [part="ranges"] {
    display: grid;
    gap: 0.35rem;
  }

  [part="range-start"],
  [part="range-end"] {
    inline-size: 100%;
    margin: 0;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: pointer;
  }

  [part="range-start"]:focus-visible,
  [part="range-end"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="range-start"]:disabled,
  [part="range-end"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export class BoxRangeSliderElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "end", "label", "max", "min", "start", "step"];
  }

  private startInternal = 20;
  private endInternal = 80;
  private labelEl!: HTMLElement;
  private startValueEl!: HTMLElement;
  private endValueEl!: HTMLElement;
  private startInputEl!: HTMLInputElement;
  private endInputEl!: HTMLInputElement;

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
    return this.getAttribute("label") ?? "Range Slider";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    return parseNumber(this.getAttribute("max"), 100);
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get min(): number {
    return parseNumber(this.getAttribute("min"), 0);
  }

  set min(value: number) {
    this.setAttribute("min", String(value));
  }

  get step(): number {
    return parseNumber(this.getAttribute("step"), 1);
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  get start(): number {
    return this.startInternal;
  }

  set start(value: number) {
    this.startInternal = value;
    this.setAttribute("start", String(value));
    if (this.isRendered) {
      this.update();
    }
  }

  get end(): number {
    return this.endInternal;
  }

  set end(value: number) {
    this.endInternal = value;
    this.setAttribute("end", String(value));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "start") {
      this.startInternal = parseNumber(this.getAttribute("start"), this.min);
    }

    if (name === "end") {
      this.endInternal = parseNumber(this.getAttribute("end"), this.max);
    }

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private clamp(nextValue: number): number {
    let normalizedValue = nextValue;
    normalizedValue = Math.max(this.min, normalizedValue);
    normalizedValue = Math.min(this.max, normalizedValue);
    return normalizedValue;
  }

  private syncValue(nextValue: RangeValue): void {
    const normalizedStart = this.clamp(Math.min(nextValue.start, nextValue.end));
    const normalizedEnd = this.clamp(Math.max(nextValue.start, nextValue.end));
    this.startInternal = normalizedStart;
    this.endInternal = normalizedEnd;
    this.setAttribute("start", String(normalizedStart));
    this.setAttribute("end", String(normalizedEnd));
    this.startValueEl.textContent = String(normalizedStart);
    this.endValueEl.textContent = String(normalizedEnd);
    this.startInputEl.value = String(normalizedStart);
    this.endInputEl.value = String(normalizedEnd);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { start: normalizedStart, end: normalizedEnd },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${rangeSliderStyles}</style>
      <label part="field">
        <span part="header">
          <span part="label"></span>
          <span part="value">
            <span part="start-value"></span>
            <span part="separator">-</span>
            <span part="end-value"></span>
          </span>
        </span>
        <div part="ranges">
          <input type="range" part="range-start" />
          <input type="range" part="range-end" />
        </div>
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.startValueEl = this.shadowRoot.querySelector('[part="start-value"]')!;
    this.endValueEl = this.shadowRoot.querySelector('[part="end-value"]')!;
    this.startInputEl = this.shadowRoot.querySelector('[part="range-start"]')!;
    this.endInputEl = this.shadowRoot.querySelector('[part="range-end"]')!;
  }

  protected setupListeners(): void {
    this.startInputEl.addEventListener("input", event => {
      const nextStart = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextStart)) {
        return;
      }

      this.syncValue({ start: nextStart, end: this.endInternal });
    });

    this.endInputEl.addEventListener("input", event => {
      const nextEnd = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextEnd)) {
        return;
      }

      this.syncValue({ start: this.startInternal, end: nextEnd });
    });
  }

  protected update(): void {
    if (!this.startInputEl || !this.endInputEl || !this.labelEl) {
      return;
    }

    const start = Math.min(this.startInternal, this.endInternal);
    const end = Math.max(this.startInternal, this.endInternal);

    this.labelEl.textContent = this.label;
    this.startValueEl.textContent = String(start);
    this.endValueEl.textContent = String(end);

    for (const input of [this.startInputEl, this.endInputEl]) {
      input.min = String(this.min);
      input.max = String(this.max);
      input.step = String(this.step);
      if (this.disabled) {
        input.setAttribute("disabled", "");
      } else {
        input.removeAttribute("disabled");
      }
    }

    if (document.activeElement !== this.startInputEl) {
      this.startInputEl.value = String(start);
    }
    if (document.activeElement !== this.endInputEl) {
      this.endInputEl.value = String(end);
    }
  }
}

export const defineBoxRangeSliderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRangeSliderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRangeSliderElement;
  }

  customElements.define(tagName, BoxRangeSliderElement);
  return BoxRangeSliderElement;
};
