import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDataFromNamedValues,
  formDescriptionMarkup,
  formErrorMessageMarkup,
  stringValuesFromFormValue,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeControl, boeRadius, boeSpace } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-select";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Select chrome tracks BUE select / `@mixin box-inputs` (height ~34px, radius 6). */
const selectStyles = `
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

  [part="select"] {
    appearance: none;
    box-sizing: border-box;
    width: 100%;
    min-height: ${boeControl.selectHeight};
    padding: 5px 25px 5px 10px;
    font: inherit;
    font-size: ${boeControl.fontSize};
    color: var(--boe-token-text-text, #222222);
    border: 1px solid ${boeControl.inputBorder};
    border-radius: ${boeRadius.control};
    /* Chevron stroke matches --boe-token-text-text-secondary fallback (#6f6f6f). */
    background:
      url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%236f6f6f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center / 12px 8px,
      var(--boe-token-surface-surface, #ffffff);
    box-shadow: 0 1px 1px 1px rgb(0 0 0 / 5%);
    cursor: pointer;
    transition:
      border-color linear 0.15s,
      box-shadow linear 0.1s;
  }

  [part="select"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="select"]:focus-visible {
    outline: 0;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 1px 1px 1px rgb(0 0 0 / 5%);
  }

  [part="select"]:disabled {
    opacity: ${boeControl.disabledOpacity};
    cursor: not-allowed;
  }

  /* Multi-select renders as a native list box: drop the single-select chevron
     and fixed height, let it show several rows. */
  [part="select"][multiple] {
    min-height: auto;
    padding: 4px;
    background-image: none;
    cursor: default;
  }

  [part="select"][multiple] option {
    padding: 3px 6px;
    border-radius: ${boeRadius.size};
  }

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class BoxSelectElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "disabled",
      "label",
      "multiple",
      "options",
      "value",
    ];
  }

  private valueInternal = "";
  private valuesInternal: string[] = [];
  private selectEl!: HTMLSelectElement;
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private errorEl!: HTMLElement;

  /** Allow selecting several options (native multi-select list box). */
  get multiple(): boolean {
    return this.hasAttribute("multiple");
  }

  set multiple(value: boolean) {
    this.toggleAttribute("multiple", Boolean(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.valuesInternal = nextValue ? [nextValue] : [];
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  /** Selected values (canonical when `multiple`; single-element otherwise). */
  get values(): string[] {
    return [...this.valuesInternal];
  }

  set values(next: string[]) {
    this.valuesInternal = Array.isArray(next) ? [...next] : [];
    this.valueInternal = this.valuesInternal[0] ?? "";
    this.setAttribute("value", this.valueInternal);
    this.syncFormAssociation();
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
    return this.getAttribute("label") ?? "Select";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): SelectOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as SelectOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: SelectOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
      if (!this.multiple) {
        this.valuesInternal = this.valueInternal ? [this.valueInternal] : [];
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    if (this.multiple) {
      return formDataFromNamedValues(this.name, this.valuesInternal);
    }
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    if (this.multiple) {
      this.valuesInternal = stringValuesFromFormValue(value, this.name);
      this.valueInternal = this.valuesInternal[0] ?? "";
      this.setAttribute("value", this.valueInternal);
    } else {
      const next = typeof value === "string" ? value : "";
      this.valueInternal = next;
      this.valuesInternal = next ? [next] : [];
      this.setAttribute("value", next);
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
      <style>${selectStyles}</style>
      <label part="field">
        <span part="label"></span>
        ${formDescriptionMarkup()}
        <select part="select"></select>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.selectEl = this.shadowRoot.querySelector('[part="select"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.selectEl.addEventListener("change", event => {
      const select = event.currentTarget as HTMLSelectElement;
      if (this.multiple) {
        this.valuesInternal = Array.from(select.selectedOptions).map(option => option.value);
        this.valueInternal = this.valuesInternal[0] ?? "";
      } else {
        this.valueInternal = select.value;
        this.valuesInternal = this.valueInternal ? [this.valueInternal] : [];
      }
      this.setAttribute("value", this.valueInternal);
      this.syncFormAssociation();
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: this.multiple
            ? { value: this.valueInternal, values: this.values }
            : { value: this.valueInternal },
        }),
      );
    });
  }

  /** Build `<option>`/`<optgroup>` markup, grouping options that carry `group`. */
  private optionsMarkup(): string {
    const renderOption = (option: SelectOption): string =>
      `<option value="${escapeHtml(option.value)}"${option.disabled ? " disabled" : ""}>${escapeHtml(option.label)}</option>`;

    const options = this.options;
    let markup = "";
    let index = 0;
    while (index < options.length) {
      const group = options[index].group;
      if (!group) {
        markup += renderOption(options[index]);
        index += 1;
        continue;
      }
      // Consume the contiguous run sharing this group label into one optgroup.
      let run = "";
      while (index < options.length && options[index].group === group) {
        run += renderOption(options[index]);
        index += 1;
      }
      markup += `<optgroup label="${escapeHtml(group)}">${run}</optgroup>`;
    }
    return markup;
  }

  protected update(): void {
    if (!this.selectEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;

    // Rebuild options (the list itself may change), grouping by `group`.
    this.selectEl.multiple = this.multiple;
    this.selectEl.innerHTML = this.optionsMarkup();

    // Patch selected value(s) and disabled after rebuilding options.
    if (this.multiple) {
      const selected = new Set(this.valuesInternal);
      Array.from(this.selectEl.options).forEach(option => {
        option.selected = selected.has(option.value);
      });
    } else {
      this.selectEl.value = this.valueInternal;
    }
    if (this.disabled) {
      this.selectEl.setAttribute("disabled", "");
    } else {
      this.selectEl.removeAttribute("disabled");
    }

    this.applyFieldSupport(this.labelEl, this.selectEl, this.descriptionEl);
    this.applyInvalidState(this.selectEl, this.errorEl);
  }
}

export const defineBoxSelectElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSelectElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSelectElement;
  }

  customElements.define(tagName, BoxSelectElement);
  return BoxSelectElement;
};
