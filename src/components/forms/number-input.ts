import { BaseElement } from "../../core/index.js";

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
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.6rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="input"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="input"]:focus-visible {
    outline: none;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="input"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export class BoxNumberInputElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "placeholder", "step", "value"];
  }

  private valueInternal = 0;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;

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

  get value(): number {
    return this.valueInternal;
  }

  set value(nextValue: number) {
    const normalizedValue = Number.isFinite(nextValue) ? nextValue : 0;
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), 0);
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private syncValue(nextValue: number): void {
    this.valueInternal = nextValue;
    this.setAttribute("value", String(nextValue));
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
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
        <input type="number" part="input" />
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl) {
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

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = String(this.valueInternal);
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }
  }
}

export const defineBoxNumberInputElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNumberInputElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNumberInputElement;
  }

  customElements.define(tagName, BoxNumberInputElement);
  return BoxNumberInputElement;
};
