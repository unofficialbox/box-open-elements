import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";

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
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="field"] {
    display: grid;
    gap: 0.45rem;
  }

  [part="header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem;
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

  ${boeFocusVisibleStyles('[part="range"]')}

  [part="range"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxSliderElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "max",
      "min",
      "step",
      "value",
    ];
  }

  private valueInternal = 0;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private valueEl!: HTMLElement;
  private errorEl!: HTMLElement;

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
    const normalizedValue = this.clamp(Number.isFinite(nextValue) ? nextValue : this.min);
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

  protected getFormValue(): FormValue {
    return String(this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const parsed =
      typeof value === "string" ? parseNumber(value, this.valueInternal) : this.valueInternal;
    this.valueInternal = this.clamp(parsed);
    this.setAttribute("value", String(this.valueInternal));
    if (this.isRendered) {
      this.update();
    }
  }

  private clamp(nextValue: number): number {
    let normalizedValue = nextValue;
    normalizedValue = Math.max(this.min, normalizedValue);
    normalizedValue = Math.min(this.max, normalizedValue);
    return normalizedValue;
  }

  private syncValue(nextValue: number): void {
    const normalizedValue = this.clamp(nextValue);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    this.valueEl.textContent = String(normalizedValue);
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: normalizedValue },
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
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="range"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
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
    if (!this.inputEl || !this.labelEl || !this.valueEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.valueEl.textContent = String(this.valueInternal);
    this.inputEl.min = String(this.min);
    this.inputEl.max = String(this.max);
    this.inputEl.step = String(this.step);

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = String(this.valueInternal);
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
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
