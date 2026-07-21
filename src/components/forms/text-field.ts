import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeControl, boeInputControlStyles, boeSpace } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-text-field";

/** Input chrome tracks BUE `@mixin box-inputs` (`src/styles/_inputs.scss`). */
const textFieldStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: grid;
    gap: ${boeSpace[2]};
  }

  [part="label"] {
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="input"] {
    appearance: none;
    width: 100%;
    font: inherit;
    font-size: ${boeControl.fontSize};
  }

  ${boeInputControlStyles('[part="input"]')}

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class BoxTextFieldElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "disabled",
      "label",
      "placeholder",
      "value",
    ];
  }

  private valueInternal = "";
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private errorEl!: HTMLElement;

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

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Input";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
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

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${textFieldStyles}</style>
      <label part="field">
        <span part="label"></span>
        ${formDescriptionMarkup()}
        <input type="text" part="input" />
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const nextValue = (event.currentTarget as HTMLInputElement).value;
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
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    // After the label text is (re)set, since it clears the required mark.
    this.applyFieldSupport(this.labelEl, this.inputEl, this.descriptionEl);
    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxTextFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTextFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTextFieldElement;
  }

  customElements.define(tagName, BoxTextFieldElement);
  return BoxTextFieldElement;
};
