import { BaseElement } from "../../core/index.js";
import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIcon,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-help-text";

const helpTextStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="help-text"] {
    display: flex;
    align-items: start;
    gap: 0.45rem;
    font-size: 0.86rem;
    line-height: 1.45;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="icon"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 1.15rem;
    height: 1.15rem;
    margin-top: 0.08rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.7rem;
    font-weight: 700;
    font-style: normal;
  }

  [part="icon"] svg {
    width: 0.78rem;
    height: 0.78rem;
    fill: currentColor;
  }

  [part="help-text"][data-tone="success"] [part="icon"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 68%, var(--boe-token-text-text, #222222));
  }

  [part="help-text"][data-tone="error"] [part="icon"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, var(--boe-token-text-text, #222222));
  }

  [part="help-text"][data-tone="warning"] [part="icon"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 18%, var(--boe-token-surface-surface, #ffffff) 82%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 52%, var(--boe-token-text-text, #222222));
  }

  [part="help-text"][data-tone="error"] {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 68%, var(--boe-token-text-text, #222222));
  }

  [part="help-text"][data-tone="success"] {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 56%, var(--boe-token-text-text, #222222));
  }

  [part="help-text"][data-tone="warning"] {
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 44%, var(--boe-token-text-text, #222222));
  }

  [part="content"] {
    display: grid;
    gap: 0.15rem;
  }

  [part="label"] {
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="label"][hidden] {
    display: none;
  }
`;

export class BoxHelpTextElement extends BaseElement {
  private readonly handleDesignSystemChange = (): void => {
    this.update();
  };

  static get observedAttributes(): string[] {
    return ["description", "label", "message", "tone"];
  }

  private helpTextEl!: HTMLElement;
  private iconEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private messageEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description;
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("message") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${helpTextStyles}</style>
      <div part="help-text" role="note">
        <span part="icon" aria-hidden="true"></span>
        <div part="content">
          <strong part="label" hidden></strong>
          <span part="description message"></span>
        </div>
      </div>
    `;
    this.helpTextEl = this.shadowRoot.querySelector('[part="help-text"]')!;
    this.iconEl = this.shadowRoot.querySelector('[part="icon"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part~="description"]')!;
  }

  protected update(): void {
    if (!this.helpTextEl) {
      return;
    }

    const iconName =
      this.tone === "error" || this.tone === "warning"
        ? "alert"
        : this.tone === "success"
          ? "checkmark"
          : "info";
    const iconMarkup = resolveDesignIcon(iconName) ?? "i";

    this.helpTextEl.dataset.tone = this.tone;
    this.helpTextEl.setAttribute("aria-label", this.label || "Help text");
    this.iconEl.setAttribute("data-icon-source", iconMarkup === "i" ? "text" : "design-system");
    this.iconEl.innerHTML = iconMarkup;

    if (this.label) {
      this.labelEl.hidden = false;
      this.labelEl.textContent = this.label;
    } else {
      this.labelEl.hidden = true;
      this.labelEl.textContent = "";
    }

    this.messageEl.textContent = this.message;
  }
}

export const defineBoxHelpTextElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxHelpTextElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxHelpTextElement;
  }

  customElements.define(tagName, BoxHelpTextElement);
  return BoxHelpTextElement;
};
