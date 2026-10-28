import { ValueReconciliation } from "./value-reconciliation.js";
import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/interaction.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeControl, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-number-input";

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const numberInputStyles = `
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

  [part="input"] {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.45rem 0.7rem;
    border: 1px solid ${boeControl.inputBorder};
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  ${boeNeutralInteractiveStyles('[part="input"]')}
  [part="input"]:hover:not(:disabled) { border-color: ${boeControl.inputBorder}; }

  [part="input"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class NumberInput extends FormAssociatedElement {
  private readonly valueReconciliation = new ValueReconciliation();
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "disabled",
      "allow-empty",
      "label",
      "max",
      "min",
      "placeholder",
      "step",
      "value",
    ];
  }

  private valueInternal: number | null = 0;
  private inputEl!: HTMLInputElement;
  focus(options?: FocusOptions): void { if (!this.disabled) this.inputEl?.focus(options); }
  private labelEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private clampStatusEl!: HTMLElement;

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
    return this.getAttribute("label") ?? "Number";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number | null {
    return this.hasAttribute("max") ? parseNumber(this.getAttribute("max"), 0) : null;
  }

  set max(value: number | null) {
    if (value == null) {
      this.removeAttribute("max");
    } else {
      this.setAttribute("max", String(value));
    }
  }

  get min(): number | null {
    return this.hasAttribute("min") ? parseNumber(this.getAttribute("min"), 0) : null;
  }

  set min(value: number | null) {
    if (value == null) {
      this.removeAttribute("min");
    } else {
      this.setAttribute("min", String(value));
    }
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get step(): number {
    return parseNumber(this.getAttribute("step"), 1);
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  /** Opt in to a nullable value. Empty optional fields are omitted from forms. */
  get allowEmpty(): boolean { return this.hasAttribute("allow-empty"); }
  set allowEmpty(value: boolean) { this.toggleAttribute("allow-empty", value); }

  get valueAsNumber(): number { return this.valueInternal ?? NaN; }
  set valueAsNumber(value: number) { this.value = value; }

  private valueText(value = this.valueInternal): string { return value == null ? "" : String(value); }

  get value(): number | null {
    return this.valueInternal;
  }

  set value(nextValue: number | null) {
    const normalizedValue = this.normalizeValue(nextValue);
    this.valueReconciliation.hostWrite(normalizedValue === this.valueInternal);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", this.valueText(normalizedValue));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      const value = this.allowEmpty ? this.normalizeValue(newValue) : this.clamp(parseNumber(newValue, this.valueInternal ?? 0));
      this.valueReconciliation.hostWrite(value === this.valueInternal);
      this.valueInternal = value;
    } else if (name === "allow-empty" || ((name === "min" || name === "max") && oldValue !== newValue)) {
      const raw = name === "allow-empty" ? this.getAttribute("value") : this.valueInternal;
      const value = this.normalizeValue(raw);
      this.valueReconciliation.hostWrite(value === this.valueInternal);
      this.valueInternal = value;
      if (this.getAttribute("value") !== this.valueText()) {
        this.valueReconciliation.reflect(() => this.setAttribute("value", this.valueText()));
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "value" && oldValue === newValue && this.isRendered) this.update();
  }

  private normalizeValue(value: unknown): number | null {
    if (this.allowEmpty && (value == null || value === "" || (typeof value === "number" && !Number.isFinite(value)))) return null;
    const number = typeof value === "number" ? value : Number(value);
    return this.clamp(Number.isFinite(number) ? number : 0);
  }

  protected getFormValue(): FormValue {
    return this.valueInternal == null ? null : String(this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    this.valueReconciliation.hostWrite(false);
    this.valueInternal = this.allowEmpty ? this.normalizeValue(value) : this.clamp(typeof value === "string" ? parseNumber(value, this.valueInternal ?? 0) : this.valueInternal ?? 0);
    this.setAttribute("value", this.valueText());
    if (this.isRendered) {
      this.update();
    }
  }

  private clamp(nextValue: number): number {
    let normalizedValue = nextValue;
    if (this.min != null) {
      normalizedValue = Math.max(this.min, normalizedValue);
    }
    if (this.max != null) {
      normalizedValue = Math.min(this.max, normalizedValue);
    }
    return normalizedValue;
  }

  private syncValue(nextValue: number | null): void {
    const normalizedValue = nextValue == null ? null : this.clamp(nextValue);
    if (normalizedValue !== nextValue) {
      this.inputEl.value = this.valueText(normalizedValue);
      const boundary = (nextValue ?? 0) > (normalizedValue ?? 0) ? "most" : "least";
      this.clampStatusEl.textContent = `Changed to ${normalizedValue}, the ${boundary} allowed`;
    } else {
      this.clampStatusEl.textContent = "";
    }
    this.valueInternal = normalizedValue;
    this.valueReconciliation.reflect(() => this.setAttribute("value", this.valueText(normalizedValue)));
    this.syncFormAssociation();
    this.valueReconciliation.emit(() =>
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: normalizedValue },
        }),
      ),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${numberInputStyles}</style>
      <label part="field">
        <span part="label"></span>
        ${formDescriptionMarkup()}
        <input type="number" part="input" />
        <span part="clamp-status" role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"></span>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.clampStatusEl = this.shadowRoot.querySelector('[part="clamp-status"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      this.valueReconciliation.trackNativeInput(event);
      const raw = (event.currentTarget as HTMLInputElement).value;
      const nextValue = this.allowEmpty && raw === "" ? null : Number(raw);
      if (nextValue !== null && !Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;
    this.inputEl.step = String(this.step);

    if (this.min == null) {
      this.inputEl.removeAttribute("min");
    } else {
      this.inputEl.min = String(this.min);
    }

    if (this.max == null) {
      this.inputEl.removeAttribute("max");
    } else {
      this.inputEl.max = String(this.max);
    }

    if (this.valueReconciliation.shouldSync(this.shadowRoot?.activeElement === this.inputEl) && this.inputEl.value !== this.valueText()) {
      this.inputEl.value = this.valueText();
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.applyFieldSupport(this.labelEl, this.inputEl, this.descriptionEl);
    if (this.allowEmpty && this.valueInternal == null) {
      this.inputEl.required = false;
      this.inputEl.setAttribute("aria-required", "false");
    }
    this.valueReconciliation.complete();
    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

NumberInput.register();
