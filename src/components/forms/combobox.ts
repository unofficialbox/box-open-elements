import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-combobox";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxComboboxOption = {
  label: string;
  value: string;
};

const comboboxStyles = `
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

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  ${boeNeutralInteractiveStyles('[part="input"]')}

  [part="input"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxComboboxElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "options",
      "placeholder",
      "value",
    ];
  }

  private valueInternal = "";
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private datalistEl!: HTMLDataListElement;
  private errorEl!: HTMLElement;

  private findOptionByLabel(label: string): BoxComboboxOption | undefined {
    return this.options.find(option => option.label === label);
  }

  private findOptionByValue(value: string): BoxComboboxOption | undefined {
    return this.options.find(option => option.value === value);
  }

  private getDisplayValue(): string {
    const matched = this.findOptionByValue(this.valueInternal);
    return matched?.label ?? this.valueInternal;
  }

  private resolveInputValue(rawValue: string): string {
    const matched = this.findOptionByLabel(rawValue);
    return matched?.value ?? rawValue;
  }

  private commitInputValue(rawValue: string): void {
    const resolvedValue = this.resolveInputValue(rawValue);
    this.valueInternal = resolvedValue;
    this.setAttribute("value", resolvedValue);
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: resolvedValue },
      }),
    );
    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.getDisplayValue();
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
    return this.getAttribute("label") ?? "Combobox";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): BoxComboboxOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxComboboxOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: BoxComboboxOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
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

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${comboboxStyles}</style>
      <label part="field">
        <span part="label"></span>
        <input type="text" part="input" list="combobox-options" />
        <datalist id="combobox-options"></datalist>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.datalistEl = this.shadowRoot.querySelector("datalist")!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const rawValue = (event.currentTarget as HTMLInputElement).value;
      this.commitInputValue(rawValue);
    });

    this.inputEl.addEventListener("change", event => {
      const rawValue = (event.currentTarget as HTMLInputElement).value;
      this.commitInputValue(rawValue);
    });

    this.inputEl.addEventListener("blur", () => {
      const rawValue = this.inputEl.value;
      const resolvedValue = this.resolveInputValue(rawValue);
      if (resolvedValue !== this.valueInternal) {
        this.commitInputValue(rawValue);
      } else if (rawValue !== this.getDisplayValue()) {
        this.inputEl.value = this.getDisplayValue();
      }
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.datalistEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;

    this.datalistEl.innerHTML = this.options
      .map(
        option =>
          `<option value="${escapeHtml(option.label)}" data-option-value="${escapeHtml(option.value)}"></option>`,
      )
      .join("");

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.getDisplayValue();
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxComboboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxComboboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxComboboxElement;
  }

  customElements.define(tagName, BoxComboboxElement);
  return BoxComboboxElement;
};
