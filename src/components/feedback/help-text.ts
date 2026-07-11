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
