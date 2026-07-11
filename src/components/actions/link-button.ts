const DEFAULT_TAG_NAME = "box-link-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxLinkButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["href", "label", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get href(): string {
    return this.getAttribute("href") ?? "#";
  }

  set href(value: string) {
    this.setAttribute("href", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Learn more";
  }

  set label(value: string) {
    this.setAttribute("label", value);
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
      <a
        part="link"
        data-tone="${escapeHtml(this.tone)}"
        href="${escapeHtml(this.href)}"
        aria-label="${escapeHtml(this.label)}"
      >
        ${escapeHtml(this.label)}
      </a>
    `;
  }
}

export const defineBoxLinkButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxLinkButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxLinkButtonElement;
  }

  customElements.define(tagName, BoxLinkButtonElement);
  return BoxLinkButtonElement;
};
