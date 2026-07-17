import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-time-field";

const timeFieldStyles = `
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

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="input"] {
    appearance: none;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="input"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="input"]:focus-visible {
    outline: none;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="input"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxTimeFieldElement extends FormAssociatedElement {
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

  private valueInternal = "";
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
    return this.getAttribute("label") ?? "Time";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): string {
    return this.getAttribute("max") ?? "";
  }

  set max(value: string) {
    this.setAttribute("max", value);
  }

  get min(): string {
    return this.getAttribute("min") ?? "";
  }

  set min(value: string) {
    this.setAttribute("min", value);
  }

  get step(): string {
    return this.getAttribute("step") ?? "60";
  }

  set step(value: string) {
    this.setAttribute("step", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? value : "";
    this.valueInternal = next;
    this.setAttribute("value", next);
    if (this.isRendered) {
      this.update();
    }
  }

  private syncValue(nextValue: string): void {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.syncFormAssociation();
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
      <style>${timeFieldStyles}</style>
      <label part="field">
        <span part="label"></span>
        <input type="time" part="input" />
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      this.syncValue((event.currentTarget as HTMLInputElement).value);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.step = this.step;

    if (this.min) {
      this.inputEl.min = this.min;
    } else {
      this.inputEl.removeAttribute("min");
    }

    if (this.max) {
      this.inputEl.max = this.max;
    } else {
      this.inputEl.removeAttribute("max");
    }

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxTimeFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTimeFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTimeFieldElement;
  }

  customElements.define(tagName, BoxTimeFieldElement);
  return BoxTimeFieldElement;
};
