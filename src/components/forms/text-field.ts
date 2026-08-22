import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  boeFormFieldSupportStyles,
  formDescriptionMarkup,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeControl, boeInputControlStyles, boeSpace } from "../../foundations/geometry/index.js";
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
} from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-text-field";

/** Detail of this element's `value-changed` event, for typed listeners. */
export interface TextFieldValueChangedDetail {
  value: string;
}

const VALID_INPUT_TYPES = new Set(["text", "email", "tel", "url", "password", "search", "number"]);

const spinnerMarkup = '<span part="spinner" aria-hidden="true"></span>';
const validMarkup =
  '<svg part="valid-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 11L3 7.5l1-1 2.5 2.5L12 3.5l1 1z" fill="currentColor"/></svg>';

/** Input chrome tracks BUE `@mixin box-inputs` (`src/styles/_inputs.scss`). */
const textFieldStyles = `
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

  [part="input"] {
    appearance: none;
    width: 100%;
    font: inherit;
    font-size: ${boeControl.fontSize};
  }

  ${boeInputControlStyles('[part="input"]')}

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  /* Control wrapper holds the input plus optional leading icon and trailing
     status. With no adornments it is layout-neutral (default renders unchanged). */
  [part="control"] {
    position: relative;
    display: block;
  }

  [part="icon"] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 0.6rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    pointer-events: none;
  }

  [part="icon"]:not(.has-content) {
    display: none;
  }

  [part="icon"]::slotted(*) {
    inline-size: 1rem;
    block-size: 1rem;
    display: block;
  }

  [part="control"][data-has-icon="true"] [part="input"] {
    padding-inline-start: 2.1rem;
  }

  [part="status"] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0.65rem;
    transform: translateY(-50%);
    display: none;
    align-items: center;
  }

  [part="control"][data-status="loading"] [part="status"],
  [part="control"][data-status="valid"] [part="status"] {
    display: inline-flex;
  }

  [part="control"][data-status="loading"] [part="input"],
  [part="control"][data-status="valid"] [part="input"] {
    padding-inline-end: 2.2rem;
  }

  [part="spinner"] {
    inline-size: 1rem;
    block-size: 1rem;
    border-radius: 999px;
    border: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, transparent);
    border-top-color: var(--boe-token-surface-surface-brand, #0061d5);
    animation: boe-text-field-spin ${boeMotionDuration.spin} ${boeMotionEasing.linear} infinite;
  }

  @keyframes boe-text-field-spin {
    to { transform: rotate(360deg); }
  }

  ${boeReducedMotionStyles('[part="spinner"]', "animation-duration: 1.6s;")}

  [part="valid-icon"] {
    inline-size: 1.05rem;
    block-size: 1.05rem;
    color: var(--boe-token-surface-status-surface-success, #26c281);
  }

  /* Password visibility toggle: a word, not an eye glyph, so the state is
     stated. Hidden entirely unless reveal is opted in on a password. */
  [part="reveal"] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0.35rem;
    transform: translateY(-50%);
    appearance: none;
    border: 0;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    background: transparent;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--boe-token-surface-surface-brand, #0061d5);
    cursor: pointer;
  }

  [part="reveal"]:hover {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent);
  }

  [part="reveal"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 1px;
  }

  [part="control"][data-reveal="true"] [part="input"] {
    padding-inline-end: 3.4rem;
  }

  /* Reveal and a trailing status can coexist: the status shifts inward. */
  [part="control"][data-reveal="true"] [part="status"] {
    inset-inline-end: 3.4rem;
  }

  [part="control"][data-reveal="true"][data-status] [part="input"] {
    padding-inline-end: 5rem;
  }

  ${boeFormFieldErrorStyles}
  ${boeFormFieldSupportStyles}
`;

export class TextField extends FormAssociatedElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.fieldObservedAttributes,
      "autocomplete",
      "disabled",
      "label",
      "placeholder",
      "reveal",
      "type",
      "loading",
      "valid",
      "value",
    ];
  }

  private valueInternal = "";
  private revealed = false;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private controlEl!: HTMLElement;
  private iconSlot!: HTMLSlotElement;
  private statusEl!: HTMLElement;
  private revealEl!: HTMLButtonElement;

  /** Input type passthrough (text/email/tel/url/password/search/number). */
  get type(): string {
    const value = this.getAttribute("type");
    return value && VALID_INPUT_TYPES.has(value) ? value : "text";
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  /**
   * `autocomplete` passthrough to the inner input ("email",
   * "current-password", "off", …). Without it password managers and
   * autofill cannot classify the field — the shadow boundary hides any
   * autocomplete the host writes on the custom element itself.
   */
  get autocomplete(): string {
    return this.getAttribute("autocomplete") ?? "";
  }

  set autocomplete(value: string) {
    if (value) {
      this.setAttribute("autocomplete", value);
    } else {
      this.removeAttribute("autocomplete");
    }
  }

  /**
   * Opt-in visibility toggle for `type="password"`: renders a Show/Hide
   * control that swaps the inner input between password and text without
   * changing the field's declared `type`.
   */
  get reveal(): boolean {
    return this.hasAttribute("reveal");
  }

  set reveal(value: boolean) {
    this.toggleAttribute("reveal", Boolean(value));
  }

  /** Shows a trailing spinner (e.g. while validating/looking up asynchronously). */
  get loading(): boolean {
    return this.hasAttribute("loading");
  }

  set loading(value: boolean) {
    this.toggleAttribute("loading", Boolean(value));
  }

  /** Shows a trailing success check (explicit valid affirmation). */
  get valid(): boolean {
    return this.hasAttribute("valid");
  }

  set valid(value: boolean) {
    this.toggleAttribute("valid", Boolean(value));
  }

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
    this.toggleAttribute("disabled", Boolean(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Input";
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
      <style>${textFieldStyles}</style>
      <label part="field">
        <span part="label"></span>
        ${formDescriptionMarkup()}
        <span part="control">
          <slot name="icon" part="icon"></slot>
          <input type="text" part="input" />
          <span part="status" aria-hidden="true"></span>
          <button type="button" part="reveal" aria-pressed="false" hidden></button>
        </span>
        ${formErrorMessageMarkup()}
      </label>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
    this.iconSlot = this.shadowRoot.querySelector('slot[name="icon"]')!;
    this.statusEl = this.shadowRoot.querySelector('[part="status"]')!;
    this.revealEl = this.shadowRoot.querySelector('[part="reveal"]')!;
  }

  protected setupListeners(): void {
    this.iconSlot.addEventListener("slotchange", () => this.syncIconSlot());

    this.revealEl.addEventListener("click", () => {
      this.revealed = !this.revealed;
      this.update();
    });

    this.inputEl.addEventListener("input", event => {
      const nextValue = (event.currentTarget as HTMLInputElement).value;
      this.valueInternal = nextValue;
      this.setAttribute("value", nextValue);
      this.syncFormAssociation();
      this.dispatchEvent(
        new CustomEvent<TextFieldValueChangedDetail>("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
    });
  }

  private syncIconSlot(): void {
    if (!this.iconSlot || !this.controlEl) {
      return;
    }
    const hasContent = this.iconSlot.assignedNodes({ flatten: true }).length > 0;
    this.iconSlot.classList.toggle("has-content", hasContent);
    this.controlEl.dataset.hasIcon = hasContent ? "true" : "false";
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    const revealActive = this.reveal && this.type === "password";
    this.inputEl.type = revealActive && this.revealed ? "text" : this.type;
    this.inputEl.placeholder = this.placeholder;
    if (this.autocomplete) {
      this.inputEl.setAttribute("autocomplete", this.autocomplete);
    } else {
      this.inputEl.removeAttribute("autocomplete");
    }
    this.syncIconSlot();

    // The reveal control only exists for a password with reveal opted in.
    this.revealEl.hidden = !revealActive;
    this.controlEl.dataset.reveal = revealActive ? "true" : "false";
    if (revealActive) {
      // The visible word and the accessible name agree; aria-pressed makes
      // the toggle state machine explicit to AT.
      this.revealEl.textContent = this.revealed ? "Hide" : "Show";
      this.revealEl.setAttribute("aria-label", this.revealed ? "Hide password" : "Show password");
      this.revealEl.setAttribute("aria-pressed", String(this.revealed));
    } else {
      this.revealed = false;
    }

    // Trailing status: loading spinner takes precedence over the valid check.
    if (this.loading) {
      this.controlEl.dataset.status = "loading";
      this.statusEl.innerHTML = spinnerMarkup;
    } else if (this.valid) {
      this.controlEl.dataset.status = "valid";
      this.statusEl.innerHTML = validMarkup;
    } else {
      this.controlEl.removeAttribute("data-status");
      this.statusEl.innerHTML = "";
    }

    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.valueInternal;
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    // After the label text is (re)set, since it clears the required mark.
    this.applyFieldSupport(this.labelEl, this.inputEl, this.descriptionEl);
    this.applyInvalidState(this.inputEl, this.errorEl);
  }
}

TextField.register();
