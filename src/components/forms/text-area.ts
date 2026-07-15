import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-text-area";

const textAreaStyles = `
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

  [part="textarea"] {
    appearance: none;
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
    resize: vertical;
    line-height: 1.5;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="textarea"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  [part="textarea"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
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
`;

export class BoxTextAreaElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "placeholder", "rows", "value"];
  }

  private valueInternal = "";
  private textareaEl!: HTMLTextAreaElement;
  private labelEl!: HTMLElement;

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
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
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
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.textareaEl = this.shadowRoot.querySelector('[part="textarea"]')!;
  }

  protected setupListeners(): void {
    this.textareaEl.addEventListener("input", event => {
      const nextValue = (event.currentTarget as HTMLTextAreaElement).value;
      this.valueInternal = nextValue;
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
    if (!this.textareaEl || !this.labelEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.textareaEl.placeholder = this.placeholder;
    this.textareaEl.rows = this.rows;

    // Only patch value when not focused to avoid disrupting active composition
    if (document.activeElement !== this.textareaEl) {
      this.textareaEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.textareaEl.setAttribute("disabled", "");
    } else {
      this.textareaEl.removeAttribute("disabled");
    }
  }
}

export const defineBoxTextAreaElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTextAreaElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTextAreaElement;
  }

  customElements.define(tagName, BoxTextAreaElement);
  return BoxTextAreaElement;
};
