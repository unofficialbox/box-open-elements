import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-switch";
const DEFAULT_VALUE = "on";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const switchStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="switch"] {
    appearance: none;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    text-align: left;
    display: inline-flex;
    align-items: flex-start;
    gap: 0.55rem;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }

  [part="switch"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
    border-radius: 0.5rem;
  }

  [part="switch"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part~="track"] {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    inline-size: 2.5rem;
    block-size: 1.4rem;
    padding: 0.15rem;
    box-sizing: border-box;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="switch"]:hover:not(:disabled) [part~="track"][data-checked="false"] {
    background: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part~="track"][data-checked="true"] {
    background: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="switch"]:hover:not(:disabled) [part~="track"][data-checked="true"] {
    background: var(--boe-token-surface-surface-brand-hover, #0057c0);
  }

  [part="switch"]:active:not(:disabled) [part~="track"][data-checked="true"] {
    background: var(--boe-token-surface-surface-brand-pressed, #004eaa);
  }

  [part~="thumb"] {
    inline-size: 1.1rem;
    block-size: 1.1rem;
    border-radius: 999px;
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.18),
      0 0 0 1px color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 45%, transparent);
    transform: translateX(0);
    transition: transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part~="thumb"][data-checked="true"] {
    transform: translateX(1.1rem);
  }

  [part="content"] {
    display: grid;
    gap: 0.2rem;
    padding-block-start: 0.05rem;
  }

  [part="label"] {
    font-weight: 600;
    color: var(--boe-token-text-text, #222222);
  }

  [part="description"] {
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxSwitchElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "checked",
      "description",
      "disabled",
      "label",
      "value",
    ];
  }

  private checkedInternal = false;
  private valueInternal = DEFAULT_VALUE;
  private switchEl!: HTMLButtonElement;
  private trackEl!: HTMLElement;
  private thumbEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private contentEl!: HTMLElement;
  private errorEl!: HTMLElement;

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
    if (this.isRendered) {
      this.update();
    }
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
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
    return this.getAttribute("label") ?? "Switch";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue || DEFAULT_VALUE;
    this.setAttribute("value", this.valueInternal);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "checked") {
      this.checkedInternal = this.hasAttribute("checked");
    }
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? DEFAULT_VALUE;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected getFormValue(): FormValue {
    return this.checkedInternal ? this.valueInternal : null;
  }

  protected restoreFormValue(value: FormValue): void {
    if (value == null) {
      this.checkedInternal = false;
      this.removeAttribute("checked");
    } else {
      this.checkedInternal = true;
      this.setAttribute("checked", "");
      if (typeof value === "string") {
        this.valueInternal = value;
        this.setAttribute("value", value);
      }
    }
    if (this.isRendered) {
      this.update();
    }
  }

  private toggleChecked(): void {
    if (this.disabled) {
      return;
    }

    const nextValue = !this.checkedInternal;
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }

    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("checked-changed", {
        bubbles: true,
        composed: true,
        detail: { checked: nextValue },
      }),
    );

    this.update();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${switchStyles}</style>
      <button
        type="button"
        part="switch"
        role="switch"
      >
        <span part="track" data-checked="false">
          <span part="thumb" data-checked="false"></span>
        </span>
        <span part="content">
          <span part="label"></span>
          <span part="description"></span>
        </span>
      </button>
      ${formErrorMessageMarkup()}
    `;
    this.switchEl = this.shadowRoot.querySelector('[part="switch"]')!;
    this.trackEl = this.shadowRoot.querySelector('[part="track"]')!;
    this.thumbEl = this.shadowRoot.querySelector('[part="thumb"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.contentEl = this.shadowRoot.querySelector('[part="content"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.switchEl.addEventListener("click", () => {
      this.toggleChecked();
    });
  }

  protected update(): void {
    if (!this.switchEl || !this.errorEl) {
      return;
    }

    const checkedStr = String(this.checkedInternal);

    this.switchEl.setAttribute("aria-label", escapeHtml(this.label));
    this.switchEl.setAttribute("aria-checked", checkedStr);
    this.switchEl.setAttribute("aria-disabled", String(this.disabled));
    if (this.disabled) {
      this.switchEl.setAttribute("disabled", "");
    } else {
      this.switchEl.removeAttribute("disabled");
    }

    this.trackEl.dataset.checked = checkedStr;
    this.trackEl.setAttribute("part", this.checkedInternal ? "track track-checked" : "track");
    this.thumbEl.dataset.checked = checkedStr;
    this.thumbEl.setAttribute("part", this.checkedInternal ? "thumb thumb-checked" : "thumb");

    this.labelEl.textContent = this.label;

    const desc = this.description;
    if (desc) {
      this.descriptionEl.textContent = desc;
      this.descriptionEl.style.display = "";
    } else {
      this.descriptionEl.textContent = "";
      this.descriptionEl.style.display = "none";
    }

    this.applyInvalidState(this.switchEl, this.errorEl);
  }
}

export const defineBoxSwitchElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSwitchElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSwitchElement;
  }

  customElements.define(tagName, BoxSwitchElement);
  return BoxSwitchElement;
};
