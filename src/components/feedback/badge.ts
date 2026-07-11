const DEFAULT_TAG_NAME = "box-badge";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxBadgeElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "tone"];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  private render(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <span part="badge" data-tone="${escapeHtml(this.tone)}" role="status" aria-label="${escapeHtml(this.label)}">${escapeHtml(this.label)}</span>
    `;
  }
}

export const defineBoxBadgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBadgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBadgeElement;
  }

  customElements.define(tagName, BoxBadgeElement);
  return BoxBadgeElement;
};
