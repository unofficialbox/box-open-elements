import { ValueReconciliation } from "./value-reconciliation.js";
import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeControl, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-text-area";

const textAreaStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="field"] {
    display: grid;
    gap: 0.45rem;
  }

  [part="label"] {
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="textarea"] {
    appearance: none;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.45rem 0.7rem;
    border: 1px solid ${boeControl.inputBorder};
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    resize: vertical;
    line-height: 1.5;
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="textarea"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="textarea"]:hover:not(:disabled) {
    border-color: ${boeControl.inputBorder};
  }

  [part="textarea"]:focus-visible {
    outline: none;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="textarea"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class TextArea extends FormAssociatedElement {
  private readonly valueReconciliation = new ValueReconciliation();
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "disabled",
      "readonly",
      "label",
      "placeholder",
      "rows",
      "value",
    ];
  }

  private valueInternal = "";
  private textareaEl!: HTMLTextAreaElement;
  focus(options?: FocusOptions): void { if (!this.disabled) this.textareaEl?.focus(options); }
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private errorEl!: HTMLElement;

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueReconciliation.hostWrite(nextValue === this.valueInternal);
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  get readonly(): boolean {
    return this.hasAttribute("readonly");
  }

  set readonly(value: boolean) {
    this.toggleAttribute("readonly", Boolean(value));
  }

  /** Focus and select the current native text; no queued preconnection work. */
  select(): void {
    if (!this.isConnected || this.disabled || this.matches(":disabled")) return;
    this.textareaEl?.focus();
    // A focus listener may detach/disable the control or hand focus elsewhere.
    if (this.isConnected && !this.disabled && !this.matches(":disabled")
      && this.shadowRoot?.activeElement === this.textareaEl) this.textareaEl.select();
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
    return this.getAttribute("label") ?? "Text area";
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

  get rows(): number {
    return Number(this.getAttribute("rows") ?? "4");
  }

  set rows(value: number) {
    this.setAttribute("rows", String(value));
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueReconciliation.hostWrite((this.getAttribute("value") ?? "") === this.valueInternal);
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "value" && oldValue === newValue && this.isRendered) this.update();
  }

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    this.valueReconciliation.hostWrite(false);
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
      <style>${textAreaStyles}</style>
      <label part="field">
        <span part="label"></span>
        <textarea part="textarea"></textarea>
        ${formDescriptionMarkup()}
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.textareaEl = this.shadowRoot.querySelector('[part="textarea"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.textareaEl.addEventListener("input", event => {
      this.valueReconciliation.trackNativeInput(event);
      const nextValue = (event.currentTarget as HTMLTextAreaElement).value;
      this.valueInternal = nextValue;
      this.valueReconciliation.reflect(() => this.setAttribute("value", nextValue));
      this.syncFormAssociation();
      this.valueReconciliation.emit(() =>
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: nextValue },
          }),
        ),
      );
    });
  }

  protected update(): void {
    if (!this.textareaEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.textareaEl.placeholder = this.placeholder;
    this.textareaEl.readOnly = this.readonly;
    this.textareaEl.rows = this.rows;
    this.applyFieldSupport(this.labelEl, this.textareaEl, this.descriptionEl);

    if (this.valueReconciliation.shouldSync(this.shadowRoot?.activeElement === this.textareaEl) && this.textareaEl.value !== this.valueInternal) {
      this.textareaEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.textareaEl.setAttribute("disabled", "");
    } else {
      this.textareaEl.removeAttribute("disabled");
    }

    this.valueReconciliation.complete();
    this.applyInvalidState(this.textareaEl, this.errorEl);
  }
}

TextArea.register();
