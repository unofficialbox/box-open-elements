import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-color-picker";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxColorSwatch = {
  label?: string;
  value: string;
};

const normalizeHex = (value: string | null): string => {
  if (!value) {
    return "#3b82f6";
  }

  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "#3b82f6";
};

const colorPickerStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: grid;
    gap: 0.5rem;
  }

  [part="label"] {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="control"] {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 42%, var(--boe-token-surface-surface, #ffffff) 58%) 100%
      );
    transition: border-color 140ms ease, box-shadow 140ms ease;
  }

  [part="control"]:focus-within {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="input"] {
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    border-radius: 0.55rem;
    background: transparent;
    cursor: pointer;
  }

  [part="input"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  [part="value"] {
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="swatches"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  [part="swatch"] {
    appearance: none;
    width: 1.7rem;
    height: 1.7rem;
    padding: 0;
    border: 2px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
    border-radius: 999px;
    background: var(--swatch-color, #ffffff);
    cursor: pointer;
    transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
  }

  [part="swatch"]:hover:not(:disabled) {
    transform: scale(1.08);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="swatch"][aria-pressed="true"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="swatch"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="swatch"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxColorPickerElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "swatches",
      "value",
    ];
  }

  private valueInternal = "#3b82f6";
  private lastSwatchesJson = "";
  private labelEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private valueEl!: HTMLElement;
  private fieldEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private swatchesEl: HTMLElement | null = null;

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
    return this.getAttribute("label") ?? "Color Picker";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get swatches(): BoxColorSwatch[] {
    const raw = this.getAttribute("swatches");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxColorSwatch[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set swatches(value: BoxColorSwatch[]) {
    this.setAttribute("swatches", JSON.stringify(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    const normalized = normalizeHex(nextValue);
    this.valueInternal = normalized;
    this.setAttribute("value", normalized);
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = normalizeHex(this.getAttribute("value"));
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? normalizeHex(value) : "#3b82f6";
    this.valueInternal = next;
    this.setAttribute("value", next);
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  private emitValueChanged(nextValue: string): void {
    if (this.disabled || nextValue === this.valueInternal) {
      return;
    }

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
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${colorPickerStyles}</style>
      <label part="field">
        <span part="label"></span>
        <div part="control">
          <input type="color" part="input" />
          <span part="value"></span>
        </div>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.fieldEl = this.shadowRoot.querySelector('[part="field"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const nextValue = normalizeHex((event.currentTarget as HTMLInputElement).value);
      this.emitValueChanged(nextValue);
    });

    this.fieldEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="swatch"]') as HTMLButtonElement | null;
      if (!button || !this.fieldEl.contains(button)) {
        return;
      }
      const nextValue = normalizeHex(button.dataset.value ?? "");
      this.emitValueChanged(nextValue);
    });
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.valueEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.setAttribute("aria-label", this.label);
    this.valueEl.textContent = this.valueInternal;

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    const swatchesJson = JSON.stringify(this.swatches);
    if (swatchesJson !== this.lastSwatchesJson) {
      this.swatchesEl?.remove();
      this.swatchesEl = null;
      this.lastSwatchesJson = swatchesJson;

      if (this.swatches.length) {
        const container = document.createElement("div");
        container.setAttribute("part", "swatches");
        container.setAttribute("role", "group");
        container.setAttribute("aria-label", `${this.label} swatches`);
        container.innerHTML = this.swatches
          .map(
            swatch => `
              <button
                type="button"
                part="swatch"
                data-value="${escapeHtml(normalizeHex(swatch.value))}"
                aria-label="${escapeHtml(swatch.label ?? normalizeHex(swatch.value))}"
                style="--swatch-color:${escapeHtml(normalizeHex(swatch.value))};"
              ></button>
            `,
          )
          .join("");
        this.fieldEl.append(container);
        this.swatchesEl = container;
      }
    }

    if (this.swatchesEl) {
      this.swatchesEl.setAttribute("aria-label", `${this.label} swatches`);
      this.swatchesEl.querySelectorAll('[part="swatch"]').forEach(node => {
        const button = node as HTMLButtonElement;
        const swatchValue = normalizeHex(button.dataset.value ?? "");
        button.setAttribute("aria-pressed", String(swatchValue === this.valueInternal));
        if (this.disabled) {
          button.setAttribute("disabled", "");
        } else {
          button.removeAttribute("disabled");
        }
      });
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

export const defineBoxColorPickerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxColorPickerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxColorPickerElement;
  }

  customElements.define(tagName, BoxColorPickerElement);
  return BoxColorPickerElement;
};
