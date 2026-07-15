import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-slider";

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sliderStyles = `
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
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  [part="range"] {
    inline-size: 100%;
    margin: 0;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: pointer;
  }

  [part="range"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="range"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export class BoxSliderElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "step", "value"];
  }

  private valueInternal = 0;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private valueEl!: HTMLElement;

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
    return this.getAttribute("label") ?? "Slider";
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

  get value(): number {
    return this.valueInternal;
  }

  set value(nextValue: number) {
    const normalizedValue = Number.isFinite(nextValue) ? nextValue : this.min;
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), this.min);
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private syncValue(nextValue: number): void {
    this.valueInternal = nextValue;
    this.valueEl.textContent = String(nextValue);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${sliderStyles}</style>
      <label part="field">
        <span part="header">
          <span part="label"></span>
          <span part="value"></span>
        </span>
        <input type="range" part="range" />
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="range"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.valueEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.valueEl.textContent = String(this.valueInternal);
    this.inputEl.min = String(this.min);
    this.inputEl.max = String(this.max);
    this.inputEl.step = String(this.step);

    if (document.activeElement !== this.inputEl) {
      this.inputEl.value = String(this.valueInternal);
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }
  }
}

export const defineBoxSliderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSliderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSliderElement;
  }

  customElements.define(tagName, BoxSliderElement);
  return BoxSliderElement;
};
