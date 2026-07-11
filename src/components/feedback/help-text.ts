import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIcon,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-help-text";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxHelpTextElement extends HTMLElement {
  private readonly handleDesignSystemChange = (): void => {
    this.render();
  };

  static get observedAttributes(): string[] {
    return ["description", "label", "message", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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
    this.render();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const labelMarkup = this.label ? `<strong part="label">${escapeHtml(this.label)}</strong>` : "";
    const iconName =
      this.tone === "error" || this.tone === "warning"
        ? "alert"
        : this.tone === "success"
          ? "checkmark"
          : "info";
    const iconMarkup = resolveDesignIcon(iconName) ?? "i";

    this.shadowRoot.innerHTML = `
      <style>
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
          color: var(--boe-token-text-text-secondary, #52606d);
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
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
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
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 14%, white 86%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 68%, var(--boe-token-text-text, #101820));
        }

        [part="help-text"][data-tone="error"] [part="icon"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, white 88%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, var(--boe-token-text-text, #101820));
        }

        [part="help-text"][data-tone="warning"] [part="icon"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 18%, white 82%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 52%, var(--boe-token-text-text, #101820));
        }

        [part="help-text"][data-tone="error"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 68%, var(--boe-token-text-text, #101820));
        }

        [part="help-text"][data-tone="success"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 56%, var(--boe-token-text-text, #101820));
        }

        [part="help-text"][data-tone="warning"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 44%, var(--boe-token-text-text, #101820));
        }

        [part="content"] {
          display: grid;
          gap: 0.15rem;
        }

        [part="label"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #101820);
        }
      </style>
      <div part="help-text" data-tone="${escapeHtml(this.tone)}" role="note" aria-label="${escapeHtml(this.label || "Help text")}">
        <span part="icon" aria-hidden="true" data-icon-source="${iconMarkup === "i" ? "text" : "design-system"}">${iconMarkup}</span>
        <div part="content">
          ${labelMarkup}
          <span part="description message">${escapeHtml(this.message)}</span>
        </div>
      </div>
    `;
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
