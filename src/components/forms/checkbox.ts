import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";
import { boeControl, boeSpace } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-checkbox";
const DEFAULT_VALUE = "on";

/** Sized toward BUE `.checkbox-container` 14×14 / radius 2 look. */
const checkboxStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: inline-flex;
    align-items: center;
    gap: ${boeSpace[2]};
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    font-size: ${boeControl.fontSize};
    transition: color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="field"]:hover:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="field"]:active:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand-pressed, #004eaa);
  }

  [part="input"] {
    inline-size: 14px;
    block-size: 14px;
    margin: 0;
    flex: 0 0 auto;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    border-radius: 2px;
    cursor: inherit;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="label"] {
    font-weight: 400;
  }

  :host([disabled]) [part="field"] {
    opacity: ${boeControl.disabledOpacity};
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
      "indeterminate",
      "label",
      "value",
    ];
  }

  private checkedInternal = false;
  private indeterminateInternal = false;
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
      this.indeterminateInternal = false;
      this.removeAttribute("indeterminate");
    } else {
      this.removeAttribute("checked");
      this.indeterminateInternal = false;
      this.removeAttribute("indeterminate");
    }
    if (this.isRendered) {
      this.update();
    }
  }

  get indeterminate(): boolean {
    return this.indeterminateInternal;
  }

  set indeterminate(value: boolean) {
    const nextValue = Boolean(value);
    this.indeterminateInternal = nextValue;
    if (nextValue) {
      this.setAttribute("indeterminate", "");
    } else {
      this.removeAttribute("indeterminate");
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
    if (name === "indeterminate") {
      this.indeterminateInternal = this.hasAttribute("indeterminate");
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
      this.indeterminateInternal = false;
      this.removeAttribute("checked");
      this.removeAttribute("indeterminate");
    } else {
      this.checkedInternal = true;
      this.indeterminateInternal = false;
      this.setAttribute("checked", "");
      this.removeAttribute("indeterminate");
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
      const input = event.currentTarget as HTMLInputElement;
      const nextValue = input.checked;
      this.checkedInternal = nextValue;
      this.indeterminateInternal = input.indeterminate;
      if (nextValue) {
        this.setAttribute("checked", "");
      } else {
        this.removeAttribute("checked");
      }
      if (this.indeterminateInternal) {
        this.setAttribute("indeterminate", "");
      } else {
        this.removeAttribute("indeterminate");
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
    this.inputEl.indeterminate = this.indeterminateInternal;
    this.inputEl.value = this.valueInternal;
    const ariaChecked = this.indeterminateInternal
      ? "mixed"
      : String(this.checkedInternal);
    this.inputEl.setAttribute("aria-checked", ariaChecked);
    this.setAttribute("aria-checked", ariaChecked);
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
