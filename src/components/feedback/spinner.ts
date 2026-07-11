const DEFAULT_TAG_NAME = "box-spinner";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSpinnerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Loading";
  }

  set label(value: string) {
    this.setAttribute("label", value);
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
      <div part="spinner" role="status" aria-live="polite">
        <span part="indicator" aria-hidden="true"></span>
        <span part="label">${escapeHtml(this.label)}</span>
      </div>
    `;
  }
}

export const defineBoxSpinnerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSpinnerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSpinnerElement;
  }

  customElements.define(tagName, BoxSpinnerElement);
  return BoxSpinnerElement;
};
