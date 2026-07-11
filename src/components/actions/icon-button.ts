import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIcon,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-icon-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxIconButtonElement extends HTMLElement {
  private readonly handleDesignSystemChange = (): void => {
    this.render();
  };

  static get observedAttributes(): string[] {
    return ["disabled", "icon", "label", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

  get icon(): string {
    return this.getAttribute("icon") ?? "•";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Icon button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "secondary";
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

    const resolvedIcon = resolveDesignIcon(this.icon);
    const iconMarkup = resolvedIcon ?? escapeHtml(this.icon);

    this.shadowRoot.innerHTML = `
      <button
        type="button"
        part="button"
        aria-label="${escapeHtml(this.label)}"
        title="${escapeHtml(this.label)}"
        data-tone="${escapeHtml(this.tone)}"
        ${this.disabled ? "disabled" : ""}
      >
        <span part="icon" aria-hidden="true" data-icon-source="${resolvedIcon ? "design-system" : "text"}">${iconMarkup}</span>
      </button>
    `;
  }
}

export const defineBoxIconButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxIconButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxIconButtonElement;
  }

  customElements.define(tagName, BoxIconButtonElement);
  return BoxIconButtonElement;
};
