import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeControl, boeRadius, boeSpace } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-select";

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

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class BoxSelectElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "disabled",
      "label",
      "options",
      "value",
    ];
  }

  private valueInternal = "";
  private selectEl!: HTMLSelectElement;
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
      const nextValue = (event.currentTarget as HTMLSelectElement).value;
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
    if (!this.selectEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;

    // Rebuild options (the list itself may change)
    this.selectEl.innerHTML = this.options
      .map(
        option =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`,
      )
      .join("");

    // Patch selected value and disabled after rebuilding options
    this.selectEl.value = this.valueInternal;
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
