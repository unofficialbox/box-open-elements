const DEFAULT_TAG_NAME = "box-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buttonStyles = `
  :host {
    display: inline-block;
  }

  button {
    font: inherit;
    padding: 0.45em 1em;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  button:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  button:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eac);
  }

  button[data-tone="neutral"] {
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #101820);
    border-color: var(--boe-token-stroke-stroke, #d6e0ea);
  }

  button[data-tone="neutral"]:hover:not(:disabled),
  button[data-tone="neutral"]:active:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f5f8fc);
  }

  button[data-tone="danger"] {
    background: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  button[data-size="small"] {
    padding: 0.25em 0.7em;
    font-size: 0.875em;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export class BoxButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "size", "tone"];
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

  get label(): string {
    return this.getAttribute("label") ?? "Button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get size(): string {
    return this.getAttribute("size") ?? "medium";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "primary";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${buttonStyles}</style>
      <button
        type="button"
        part="button"
        data-tone="${escapeHtml(this.tone)}"
        data-size="${escapeHtml(this.size)}"
        ${this.disabled ? "disabled" : ""}
      >
        ${escapeHtml(this.label)}
      </button>
    `;
  }
}

export const defineBoxButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxButtonElement;
  }

  customElements.define(tagName, BoxButtonElement);
  return BoxButtonElement;
};
