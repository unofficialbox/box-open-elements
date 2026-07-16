import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-rating";

const ratingStyles = `
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
  }

  [part="control"] {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.25rem 0.35rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 90%, var(--boe-token-surface-surface, #ffffff) 10%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 12px 24px rgba(15, 23, 42, 0.04);
  }

  [part="star"] {
    inline-size: 1.85rem;
    block-size: 1.85rem;
    display: grid;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 0.55rem;
    background: transparent;
    color: rgba(82, 96, 109, 0.45);
    cursor: pointer;
    transition:
      color 140ms ease,
      background 140ms ease,
      transform 140ms ease;
  }

  [part="star"][data-filled="true"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    border-color: transparent;
    background: transparent;
  }

  [part="star"]:hover:not(:disabled) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    background: transparent;
  }

  [part="star"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 2px;
  }

  [part="star"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  [part="icon"] {
    font-size: 1.15rem;
    line-height: 1;
  }

  [part="value"] {
    font-size: 0.88rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxRatingElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "max",
      "value",
    ];
  }

  private valueInternal = 0;
  private lastMax = 0;
  private labelEl!: HTMLElement;
  private controlEl!: HTMLElement;
  private valueEl!: HTMLElement;
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
    return this.getAttribute("label") ?? "Rating";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    const raw = Number(this.getAttribute("max") ?? "5");
    return Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.round(raw)) : 5;
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(value: number) {
    const nextValue = this.normalizeValue(value);
    this.valueInternal = nextValue;
    this.setAttribute("value", String(nextValue));
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.normalizeValue(Number(this.getAttribute("value") ?? "0"));
    }

    if (name === "max" && this.valueInternal > this.max) {
      this.valueInternal = this.max;
      this.setAttribute("value", String(this.valueInternal));
    }

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return String(this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const parsed = typeof value === "string" ? Number(value) : 0;
    this.valueInternal = this.normalizeValue(parsed);
    this.setAttribute("value", String(this.valueInternal));
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  private normalizeValue(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(this.max, Math.max(0, Math.round(value)));
  }

  private emitValueChanged(nextValue: number): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
  }

  private updateValue(nextValue: number): void {
    if (this.disabled) {
      return;
    }

    const normalized = this.normalizeValue(nextValue);
    this.valueInternal = normalized;
    this.setAttribute("value", String(normalized));
    this.syncFormAssociation();
    this.emitValueChanged(normalized);
    if (this.isRendered) {
      this.update();
    }
  }

  private handleKeydown = (rawEvent: Event): void => {
    const event = rawEvent as KeyboardEvent;

    if (this.disabled) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      this.updateValue(this.valueInternal >= this.max ? this.max : this.valueInternal + 1);
      this.focusActiveStar();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      this.updateValue(this.valueInternal <= 1 ? 0 : this.valueInternal - 1);
      this.focusActiveStar();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      this.updateValue(0);
      this.focusActiveStar();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      this.updateValue(this.max);
      this.focusActiveStar();
    }
  };

  private focusActiveStar(): void {
    queueMicrotask(() => {
      const active = this.controlEl?.querySelector<HTMLButtonElement>(
        '[part="star"][tabindex="0"]',
      );
      active?.focus();
    });
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${ratingStyles}</style>
      <div part="field">
        <div part="label"></div>
        <div part="control" role="radiogroup">
          <span part="value"></span>
        </div>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
    this.valueEl = this.shadowRoot.querySelector('[part="value"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.controlEl.addEventListener("keydown", this.handleKeydown);
    this.controlEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="star"]') as HTMLButtonElement | null;
      if (!button || !this.controlEl.contains(button)) {
        return;
      }
      const value = Number(button.dataset.value ?? "0");
      this.updateValue(value);
    });
  }

  protected update(): void {
    if (!this.labelEl || !this.controlEl || !this.valueEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.controlEl.setAttribute("aria-label", this.label);
    this.controlEl.setAttribute("aria-disabled", String(this.disabled));
    this.valueEl.textContent = `${this.valueInternal}/${this.max}`;

    if (this.lastMax !== this.max) {
      const stars = Array.from({ length: this.max }, (_, index) => {
        const ratingValue = index + 1;
        return `
          <button
            type="button"
            part="star"
            role="radio"
            data-value="${ratingValue}"
          >
            <span part="icon" aria-hidden="true">★</span>
          </button>
        `;
      }).join("");
      this.controlEl.innerHTML = `${stars}<span part="value"></span>`;
      this.valueEl = this.shadowRoot!.querySelector('[part="value"]')!;
      this.valueEl.textContent = `${this.valueInternal}/${this.max}`;
      this.lastMax = this.max;
    }

    this.controlEl.querySelectorAll('[part="star"]').forEach(node => {
      const button = node as HTMLButtonElement;
      const ratingValue = Number(button.dataset.value ?? "0");
      const selected = this.valueInternal === ratingValue;
      const filled = this.valueInternal >= ratingValue;
      button.setAttribute("aria-checked", String(selected));
      button.setAttribute("aria-label", `${ratingValue} ${ratingValue === 1 ? "star" : "stars"}`);
      button.dataset.filled = String(filled);
      button.tabIndex = selected || (this.valueInternal === 0 && ratingValue === 1) ? 0 : -1;
      if (this.disabled) {
        button.setAttribute("disabled", "");
      } else {
        button.removeAttribute("disabled");
      }
    });

    this.applyInvalidState(this.controlEl, this.errorEl);
  }
}

export const defineBoxRatingElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRatingElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRatingElement;
  }

  customElements.define(tagName, BoxRatingElement);
  return BoxRatingElement;
};
