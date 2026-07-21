import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-date-field";

const dateFieldStyles = `
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
    appearance: none;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="input"]')}

  [part="input"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  /* Control wrapper — layout-neutral until a clear button appears. */
  [part="control"] {
    position: relative;
    display: block;
  }

  [part="control"] [part="input"] {
    inline-size: 100%;
    box-sizing: border-box;
  }

  /* Clear button sits just left of the native calendar indicator. */
  [part="clear"] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 2rem;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    justify-content: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="control"][data-clearable="true"] [part="clear"] {
    display: inline-flex;
  }

  [part="clear"] svg {
    inline-size: 0.7rem;
    block-size: 0.7rem;
  }

  ${boeNeutralInteractiveStyles('[part="clear"]')}

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class BoxDateFieldElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "clearable",
      "disabled",
      "label",
      "max",
      "min",
      "value",
    ];
  }

  private valueInternal = "";
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private controlEl!: HTMLElement;
  private clearEl!: HTMLButtonElement;

  /** Shows a clear button that resets the value when a date is set. */
  get clearable(): boolean {
    return this.hasAttribute("clearable");
  }

  set clearable(value: boolean) {
    this.toggleAttribute("clearable", Boolean(value));
  }

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
    return this.getAttribute("label") ?? "Date";
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
      <style>${dateFieldStyles}</style>
      <label part="field">
        <span part="label"></span>
        ${formDescriptionMarkup()}
        <span part="control">
          <input type="date" part="input" />
          <button type="button" part="clear" aria-label="Clear date" tabindex="-1">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </span>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
    this.clearEl = this.shadowRoot.querySelector('[part="clear"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      this.syncValue((event.currentTarget as HTMLInputElement).value);
    });
    this.clearEl.addEventListener("click", () => this.clear());
  }

  /** Reset the date to empty and emit value-changed. */
  clear(): void {
    if (this.disabled || !this.valueInternal) {
      return;
    }
    this.inputEl.value = "";
    this.syncValue("");
    this.inputEl.focus();
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;

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

    // Clear button only when clearable, enabled, and a value is present.
    const showClear = this.clearable && !this.disabled && Boolean(this.valueInternal);
    this.controlEl.dataset.clearable = showClear ? "true" : "false";

    this.applyFieldSupport(this.labelEl, this.inputEl, this.descriptionEl);
    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxDateFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDateFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDateFieldElement;
  }

  customElements.define(tagName, BoxDateFieldElement);
  return BoxDateFieldElement;
};
