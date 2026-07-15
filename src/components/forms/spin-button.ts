import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-spin-button";

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const spinButtonStyles = `
  :host {
    display: inline-block;
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

  [part="control"] {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    overflow: hidden;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="control"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="control"]:focus-within {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="decrement"],
  [part="increment"] {
    appearance: none;
    border: none;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    font-weight: 700;
    inline-size: 2.25rem;
    cursor: pointer;
    transition:
      background 140ms ease,
      color 140ms ease;
  }

  [part="decrement"] {
    border-inline-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
  }

  [part="increment"] {
    border-inline-start: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
  }

  [part="decrement"]:hover:not(:disabled),
  [part="increment"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="decrement"]:active:not(:disabled),
  [part="increment"]:active:not(:disabled) {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
  }

  [part="decrement"]:focus-visible,
  [part="increment"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: -2px;
  }

  [part="input"] {
    appearance: textfield;
    border: none;
    background: transparent;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    text-align: center;
    font-variant-numeric: tabular-nums;
    padding: 0.6rem 0.5rem;
    inline-size: 4.5rem;
    min-inline-size: 0;
  }

  [part="input"]::-webkit-outer-spin-button,
  [part="input"]::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  [part="input"]:focus {
    outline: none;
  }

  [part="decrement"]:disabled,
  [part="increment"]:disabled,
  [part="input"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxSpinButtonElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "max",
      "min",
      "step",
      "value",
    ];
  }

  private valueInternal = 0;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private decrementEl!: HTMLButtonElement;
  private incrementEl!: HTMLButtonElement;
  private errorEl!: HTMLElement;

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
    return this.getAttribute("label") ?? "Spin Button";
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

  get step(): number {
    return parseNumber(this.getAttribute("step"), 1);
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(nextValue: number) {
    const normalizedValue = this.clamp(Number.isFinite(nextValue) ? nextValue : 0);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), 0);
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return String(this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const parsed =
      typeof value === "string" ? parseNumber(value, this.valueInternal) : this.valueInternal;
    this.valueInternal = this.clamp(parsed);
    this.setAttribute("value", String(this.valueInternal));
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

  private syncValue(nextValue: number): void {
    const normalizedValue = this.clamp(nextValue);
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    this.inputEl.value = String(normalizedValue);
    this.syncInputAria();
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: normalizedValue },
      }),
    );
  }

  private syncInputAria(): void {
    this.inputEl.setAttribute("role", "spinbutton");
    this.inputEl.setAttribute("aria-valuenow", String(this.valueInternal));
    if (this.min != null) {
      this.inputEl.setAttribute("aria-valuemin", String(this.min));
    } else {
      this.inputEl.removeAttribute("aria-valuemin");
    }
    if (this.max != null) {
      this.inputEl.setAttribute("aria-valuemax", String(this.max));
    } else {
      this.inputEl.removeAttribute("aria-valuemax");
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${spinButtonStyles}</style>
      <div part="field">
        <span part="label"></span>
        <div part="control">
          <button type="button" part="decrement" aria-label="Decrease value">-</button>
          <input type="number" part="input" />
          <button type="button" part="increment" aria-label="Increase value">+</button>
        </div>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.decrementEl = this.shadowRoot.querySelector('[part="decrement"]')!;
    this.incrementEl = this.shadowRoot.querySelector('[part="increment"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });

    this.inputEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        this.syncValue(this.valueInternal + this.step);
      }

      if (keyboardEvent.key === "ArrowDown") {
        keyboardEvent.preventDefault();
        this.syncValue(this.valueInternal - this.step);
      }

      if (keyboardEvent.key === "Home" && this.min != null) {
        keyboardEvent.preventDefault();
        this.syncValue(this.min);
      }

      if (keyboardEvent.key === "End" && this.max != null) {
        keyboardEvent.preventDefault();
        this.syncValue(this.max);
      }
    });

    this.decrementEl.addEventListener("click", () => {
      this.syncValue(this.valueInternal - this.step);
    });

    this.incrementEl.addEventListener("click", () => {
      this.syncValue(this.valueInternal + this.step);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
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

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = String(this.valueInternal);
    }

    this.syncInputAria();

    for (const el of [this.inputEl, this.decrementEl, this.incrementEl]) {
      if (this.disabled) {
        el.setAttribute("disabled", "");
      } else {
        el.removeAttribute("disabled");
      }
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxSpinButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSpinButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSpinButtonElement;
  }

  customElements.define(tagName, BoxSpinButtonElement);
  return BoxSpinButtonElement;
};
