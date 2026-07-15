import { BaseElement } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-checkbox";

const checkboxStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    transition: color 140ms ease;
  }

  [part="field"]:hover:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="field"]:active:not(:has([part="input"]:disabled)) {
    color: var(--boe-token-surface-surface-brand-pressed, #004eaa);
  }

  [part="input"] {
    inline-size: 1rem;
    block-size: 1rem;
    margin: 0;
    flex: 0 0 auto;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: inherit;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="label"] {
    font-weight: 500;
  }

  :host([disabled]) [part="field"] {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export class BoxCheckboxElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["checked", "disabled", "label"];
  }

  private checkedInternal = false;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLSpanElement;

  get checked(): boolean {
    return this.checkedInternal;
  }

  set checked(value: boolean) {
    const nextValue = Boolean(value);
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
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
    return this.getAttribute("label") ?? "Checkbox";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "checked") {
      this.checkedInternal = this.hasAttribute("checked");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${checkboxStyles}</style>
      <label part="field">
        <input
          type="checkbox"
          part="input"
        />
        <span part="label"></span>
      </label>
    `;

    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("change", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).checked;
      this.checkedInternal = nextValue;
      if (nextValue) {
        this.setAttribute("checked", "");
      } else {
        this.removeAttribute("checked");
      }
      this.dispatchEvent(
        new CustomEvent("checked-changed", {
          bubbles: true,
          composed: true,
          detail: { checked: nextValue },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.inputEl) {
      return;
    }

    this.inputEl.checked = this.checkedInternal;
    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }
    this.inputEl.setAttribute("aria-label", this.label);
    this.labelEl.textContent = this.label;
  }
}

export const defineBoxCheckboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCheckboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCheckboxElement;
  }

  customElements.define(tagName, BoxCheckboxElement);
  return BoxCheckboxElement;
};
