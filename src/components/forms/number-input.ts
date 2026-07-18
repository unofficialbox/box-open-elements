import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-number-input";

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const numberInputStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: grid;
    gap: 0.45rem;
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="input"] {
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  ${boeNeutralInteractiveStyles('[part="input"]')}

  [part="input"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxNumberInputElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "max",
      "min",
      "placeholder",
      "step",
      "value",
    ];
  }

  private valueInternal = 0;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
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
    return this.getAttribute("label") ?? "Number";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number | null {
    return this.hasAttribute("max") ? parseNumber(this.getAttribute("max"), 0) : null;
  }

  set max(value: number | null) {
    if (value == null) {
      this.removeAttribute("max");
    } else {
      this.setAttribute("max", String(value));
    }
  }

  get min(): number | null {
    return this.hasAttribute("min") ? parseNumber(this.getAttribute("min"), 0) : null;
  }

  set min(value: number | null) {
    if (value == null) {
      this.removeAttribute("min");
    } else {
      this.setAttribute("min", String(value));
    }
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
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
    const normalizedValue = this.clamp(Number.isFinite(nextValue) ? nextValue : 0);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.clamp(parseNumber(newValue, this.valueInternal));
    } else if (name === "min" || name === "max") {
      const clamped = this.clamp(this.valueInternal);
      this.valueInternal = clamped;
      if (this.getAttribute("value") !== String(clamped)) {
        this.setAttribute("value", String(clamped));
      }
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
    if (this.min != null) {
      normalizedValue = Math.max(this.min, normalizedValue);
    }
    if (this.max != null) {
      normalizedValue = Math.min(this.max, normalizedValue);
    }
    return normalizedValue;
  }

  private syncValue(nextValue: number): void {
    const normalizedValue = this.clamp(nextValue);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
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
      <style>${numberInputStyles}</style>
      <label part="field">
        <span part="label"></span>
        <input type="number" part="input" />
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
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
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;
    this.inputEl.step = String(this.step);

    if (this.min == null) {
      this.inputEl.removeAttribute("min");
    } else {
      this.inputEl.min = String(this.min);
    }

    if (this.max == null) {
      this.inputEl.removeAttribute("max");
    } else {
      this.inputEl.max = String(this.max);
    }

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

export const defineBoxNumberInputElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNumberInputElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNumberInputElement;
  }

  customElements.define(tagName, BoxNumberInputElement);
  return BoxNumberInputElement;
};
