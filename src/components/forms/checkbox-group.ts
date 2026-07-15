import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formDataFromNamedValues,
  formErrorMessageMarkup,
  stringValuesFromFormValue,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import {
  boeFocusRingShadow,
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-checkbox-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type CheckboxGroupOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

const checkboxGroupStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="group"] {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }

  [part="label"] {
    margin: 0 0 0.8rem;
    padding: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="options"] {
    display: grid;
    gap: 0.65rem;
  }

  [part="option"] {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.82rem 0.9rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.95rem;
    cursor: pointer;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="option"]:hover:not(:has([part="input"]:disabled)) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="option"]:active:not(:has([part="input"]:disabled)) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part="option"]:has([part="input"]:checked) {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, var(--boe-token-stroke-stroke, #e8e8e8) 80%);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 9%, var(--boe-token-surface-surface, #ffffff) 91%) 0%,
        color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 58%, var(--boe-token-surface-surface, #ffffff) 42%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 10px 20px rgba(15, 23, 42, 0.04);
  }

  [part="option"]:focus-within {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  [part="option"]:has([part="input"]:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part="input"] {
    inline-size: 1rem;
    block-size: 1rem;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    margin: 0;
    flex: 0 0 auto;
    cursor: inherit;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="option-label"] {
    font-weight: 500;
    color: var(--boe-token-text-text, #222222);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxCheckboxGroupElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "options",
      "value",
    ];
  }

  private valueInternal: string[] = [];
  private lastOptionsJson = "";
  private legendEl!: HTMLLegendElement;
  private optionsContainerEl!: HTMLDivElement;
  private errorEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Options";
  }

  set label(value: string) {
    this.setAttribute("label", value);
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

  get options(): CheckboxGroupOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CheckboxGroupOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: CheckboxGroupOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string[] {
    return [...this.valueInternal];
  }

  set value(nextValue: string[]) {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      const raw = this.getAttribute("value");
      if (!raw) {
        this.valueInternal = [];
      } else {
        try {
          const parsed = JSON.parse(raw) as string[];
          this.valueInternal = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.valueInternal = [];
        }
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return formDataFromNamedValues(this.name, this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const next = stringValuesFromFormValue(value, this.name);
    this.valueInternal = next;
    this.setAttribute("value", JSON.stringify(next));
    if (this.isRendered) {
      this.update();
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${checkboxGroupStyles}</style>
      <fieldset part="group">
        <legend part="label"></legend>
        <div part="options"></div>
        ${formErrorMessageMarkup()}
      </fieldset>
    `;
    this.legendEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.optionsContainerEl = this.shadowRoot.querySelector('[part="options"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.optionsContainerEl.addEventListener("change", event => {
      if (this.disabled) {
        return;
      }
      const target = event.target as HTMLInputElement;
      if (target.getAttribute("part") !== "input") {
        return;
      }

      const selected = Array.from(
        this.optionsContainerEl.querySelectorAll('[part="input"]:checked'),
      ).map(node => (node as HTMLInputElement).value);

      this.valueInternal = selected;
      this.setAttribute("value", JSON.stringify(selected));
      this.syncFormAssociation();
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: [...selected] },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.legendEl || !this.optionsContainerEl || !this.errorEl) {
      return;
    }

    this.legendEl.textContent = this.label;

    const optionsJson = JSON.stringify(this.options);
    if (optionsJson !== this.lastOptionsJson) {
      this.optionsContainerEl.innerHTML = this.options
        .map(
          option => `
            <label part="option">
              <input
                type="checkbox"
                part="input"
                value="${escapeHtml(option.value)}"
                data-option-disabled="${option.disabled ? "true" : "false"}"
              />
              <span part="option-label">${escapeHtml(option.label)}</span>
            </label>
          `,
        )
        .join("");
      this.lastOptionsJson = optionsJson;
    }

    this.optionsContainerEl.querySelectorAll('[part="input"]').forEach(node => {
      const input = node as HTMLInputElement;
      input.checked = this.valueInternal.includes(input.value);
      const optionDisabled = input.dataset.optionDisabled === "true";
      if (this.disabled || optionDisabled) {
        input.setAttribute("disabled", "");
      } else {
        input.removeAttribute("disabled");
      }
    });

    this.applyInvalidStateToControls(
      Array.from(this.optionsContainerEl.querySelectorAll<HTMLInputElement>('[part="input"]')),
      this.errorEl,
    );
  }
}

export const defineBoxCheckboxGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCheckboxGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCheckboxGroupElement;
  }

  customElements.define(tagName, BoxCheckboxGroupElement);
  return BoxCheckboxGroupElement;
};
