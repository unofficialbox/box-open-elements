import {
  FORM_ERROR_MESSAGE_ID,
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import {
  boeFocusRingShadow,
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-radio-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const radioGroupStyles = `
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
    margin: 0 0 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [part="options"] {
    display: grid;
    gap: 0.4rem;
  }

  [part~="option"] {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.55rem;
    border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    border-radius: 0.55rem;
    background: var(--boe-token-surface-surface, #ffffff);
    cursor: pointer;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part~="option"]:hover:not(:has([part="input"]:disabled)) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part~="option"]:active:not(:has([part="input"]:disabled)) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part~="option-selected"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, var(--boe-token-stroke-stroke, #e8e8e8) 76%);
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 68%, var(--boe-token-surface-surface, #ffffff) 32%);
  }

  [part~="option"]:focus-within {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  [part~="option"]:has([part="input"]:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part="input"] {
    appearance: none;
    inline-size: 1rem;
    block-size: 1rem;
    margin: 0;
    flex: 0 0 auto;
    border: 1.5px solid var(--boe-token-stroke-stroke-hover, #bcbcbc);
    border-radius: 999px;
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: inset 0 0 0 0 transparent;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="input"]:checked {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: inset 0 0 0 0.28rem var(--boe-token-surface-surface-brand, #0061d5);
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="option-label"] {
    font-weight: 500;
    color: var(--boe-token-text-text, #222222);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxRadioGroupElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "options",
      "value",
    ];
  }

  private valueInternal = "";
  private groupName = "radio-group-" + Math.random().toString(36).slice(2);
  private lastOptionsJson = "";

  private legendEl!: HTMLLegendElement;
  private optionsContainerEl!: HTMLDivElement;
  private errorEl!: HTMLElement;

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
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
    return this.getAttribute("label") ?? "Options";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): Array<{ label: string; value: string }> {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<{ label: string; value: string }>;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: Array<{ label: string; value: string }>) {
    this.setAttribute("options", JSON.stringify(value));
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    const selected = this.options.some(option => option.value === this.valueInternal);
    return selected ? this.valueInternal : null;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? value : "";
    this.valueInternal = next;
    this.setAttribute("value", next);
    if (this.isRendered) {
      this.update();
    }
  }

  private getRadioGroupName(): string {
    return this.name || this.groupName;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${radioGroupStyles}</style>
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

  protected update(): void {
    if (!this.legendEl || !this.optionsContainerEl || !this.errorEl) {
      return;
    }

    this.legendEl.textContent = this.label;

    const currentOptionsJson = JSON.stringify(this.options);
    const radioGroupName = this.getRadioGroupName();
    if (currentOptionsJson !== this.lastOptionsJson) {
      this.optionsContainerEl.innerHTML = this.options
        .map(
          option => `
            <label part="option" data-value="${escapeHtml(option.value)}">
              <input type="radio" part="input" name="${escapeHtml(radioGroupName)}" value="${escapeHtml(option.value)}" />
              <span part="option-label">${escapeHtml(option.label)}</span>
            </label>
          `,
        )
        .join("");
      this.lastOptionsJson = currentOptionsJson;

      this.optionsContainerEl.querySelectorAll('[part="input"]').forEach(node => {
        node.addEventListener("change", event => {
          if (this.disabled) {
            return;
          }
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
      });
    } else {
      this.optionsContainerEl.querySelectorAll('[part="input"]').forEach(node => {
        const input = node as HTMLInputElement;
        if (input.name !== radioGroupName) {
          input.name = radioGroupName;
        }
      });
    }

    this.optionsContainerEl.querySelectorAll('[part~="option"]').forEach(labelNode => {
      const label = labelNode as HTMLLabelElement;
      const val = label.dataset.value;
      const isSelected = val === this.valueInternal;

      label.dataset.selected = String(isSelected);
      label.setAttribute("part", `option${isSelected ? " option-selected" : ""}`);

      const input = label.querySelector('[part="input"]') as HTMLInputElement | null;
      if (input) {
        input.checked = isSelected;
        if (this.disabled) {
          input.setAttribute("disabled", "");
        } else {
          input.removeAttribute("disabled");
        }
      }
    });

    const invalid = this.invalid;
    const message = this.errorMessage;
    this.optionsContainerEl.querySelectorAll<HTMLInputElement>('[part="input"]').forEach(input => {
      input.setAttribute("aria-invalid", String(invalid));
      if (invalid && message) {
        input.setAttribute("aria-errormessage", FORM_ERROR_MESSAGE_ID);
      } else {
        input.removeAttribute("aria-errormessage");
      }
    });
    this.errorEl.textContent = message;
    this.errorEl.hidden = !(invalid && Boolean(message));
    this.syncFormAssociation();
  }
}

export const defineBoxRadioGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRadioGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRadioGroupElement;
  }

  customElements.define(tagName, BoxRadioGroupElement);
  return BoxRadioGroupElement;
};
