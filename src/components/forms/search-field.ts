import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-search-field";

const searchFieldStyles = `
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

  [part="input-shell"] {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.25rem 0.25rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: ${boeRadius.field};
    background: var(--boe-token-surface-surface, #ffffff);
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="input-shell"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="input-shell"]:focus-within {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="input"] {
    appearance: none;
    flex: 1 1 auto;
    min-inline-size: 0;
    border: none;
    background: transparent;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.3rem 0;
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="input"]:focus {
    outline: none;
  }

  [part="input"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="submit"],
  [part="clear"] {
    appearance: none;
    flex: 0 0 auto;
    font: inherit;
    font-weight: 600;
    padding: 0.35rem 0.7rem;
    border-radius: ${boeRadius.control};
    cursor: pointer;
    transition:
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="submit"] {
    border: 1px solid transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="submit"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  [part="submit"]:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eac);
  }

  [part="clear"] {
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="clear"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="submit"]:focus-visible,
  [part="clear"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="submit"]:disabled,
  [part="clear"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxSearchFieldElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "placeholder",
      "value",
    ];
  }

  private valueInternal = "";
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private submitEl!: HTMLButtonElement;
  private clearEl!: HTMLButtonElement;
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
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Search";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Search";
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

  clear(): void {
    if (this.disabled || !this.valueInternal) {
      return;
    }

    this.value = "";
    this.syncFormAssociation();
    this.dispatchEvent(new CustomEvent("clear", { bubbles: true, composed: true, detail: { value: "" } }));
    this.dispatchEvent(new CustomEvent("value-changed", { bubbles: true, composed: true, detail: { value: "" } }));
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
      <style>${searchFieldStyles}</style>
      <label part="field">
        <span part="label"></span>
        <div part="input-shell">
          <input type="search" part="input" />
          <button type="button" part="submit">Search</button>
          <button type="button" part="clear">Clear</button>
        </div>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.submitEl = this.shadowRoot.querySelector('[part="submit"]')!;
    this.clearEl = this.shadowRoot.querySelector('[part="clear"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).value;
      this.valueInternal = nextValue;
      this.setAttribute("value", nextValue);
      this.syncFormAssociation();
      this.clearEl.disabled = this.disabled || nextValue.length === 0;
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
    });
    this.inputEl.addEventListener("keydown", event => {
      if (this.disabled) {
        return;
      }
      if (event.key === "Enter") {
        this.dispatchEvent(
          new CustomEvent("search", {
            bubbles: true,
            composed: true,
            detail: { value: this.valueInternal },
          }),
        );
      }
    });
    this.submitEl.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("search", {
          bubbles: true,
          composed: true,
          detail: { value: this.valueInternal },
        }),
      );
    });
    this.clearEl.addEventListener("click", () => {
      this.clear();
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.submitEl || !this.clearEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
      this.submitEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
      this.submitEl.removeAttribute("disabled");
    }

    this.clearEl.disabled = this.disabled || this.valueInternal.length === 0;

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxSearchFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSearchFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSearchFieldElement;
  }

  customElements.define(tagName, BoxSearchFieldElement);
  return BoxSearchFieldElement;
};
