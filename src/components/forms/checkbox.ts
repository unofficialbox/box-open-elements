import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-checkbox";
const DEFAULT_VALUE = "on";

const checkboxStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    transition: color 140ms ease;
  }

  [part="field"]:hover:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="field"]:active:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand-pressed, #004eaa);
  }

  [part="input"] {
    inline-size: 1rem;
    block-size: 1rem;
    margin: 0;
    flex: 0 0 auto;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: inherit;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="label"] {
    font-weight: 500;
  }

  :host([disabled]) [part="field"] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxCheckboxElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "checked",
      "disabled",
      "label",
      "value",
    ];
  }

  private checkedInternal = false;
  private valueInternal = DEFAULT_VALUE;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLSpanElement;
  private errorEl!: HTMLElement;

  get checked(): boolean {
    return this.checkedInternal;
  }

  set checked(value: boolean) {
    const nextValue = Boolean(value);
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
    if (this.isRendered) {
      this.update();
    }
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
    return this.getAttribute("label") ?? "Checkbox";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue || DEFAULT_VALUE;
    this.setAttribute("value", this.valueInternal);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "checked") {
      this.checkedInternal = this.hasAttribute("checked");
    }
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? DEFAULT_VALUE;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return this.checkedInternal ? this.valueInternal : null;
  }

  protected restoreFormValue(value: FormValue): void {
    if (value == null) {
      this.checkedInternal = false;
      this.removeAttribute("checked");
    } else {
      this.checkedInternal = true;
      this.setAttribute("checked", "");
      if (typeof value === "string") {
        this.valueInternal = value;
        this.setAttribute("value", value);
      }
    }
    if (this.isRendered) {
      this.update();
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${checkboxStyles}</style>
      <label part="field">
        <input
          type="checkbox"
          part="input"
        />
        <span part="label"></span>
      </label>
      ${formErrorMessageMarkup()}
    `;

    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("change", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).checked;
      this.checkedInternal = nextValue;
      if (nextValue) {
        this.setAttribute("checked", "");
      } else {
        this.removeAttribute("checked");
      }
      this.syncFormAssociation();
      this.dispatchEvent(
        new CustomEvent("checked-changed", {
          bubbles: true,
          composed: true,
          detail: { checked: nextValue },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.errorEl) {
      return;
    }

    this.inputEl.checked = this.checkedInternal;
    this.inputEl.value = this.valueInternal;
    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }
    this.inputEl.setAttribute("aria-label", this.label);
    this.labelEl.textContent = this.label;

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxCheckboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCheckboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCheckboxElement;
  }

  customElements.define(tagName, BoxCheckboxElement);
  return BoxCheckboxElement;
};
