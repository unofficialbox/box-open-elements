const DEFAULT_TAG_NAME = "box-app-shell";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxAppShellElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get title(): string {
    return this.getAttribute("title") ?? "App Shell";
  }

  set title(value: string) {
    this.setAttribute("title", value);
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
      <section part="shell" aria-label="${escapeHtml(this.title)}">
        <header part="header">
          <div part="header-main">
            <slot name="eyebrow"></slot>
            <h2 part="title">${escapeHtml(this.title)}</h2>
          </div>
          <div part="header-actions">
            <slot name="header-actions"></slot>
          </div>
        </header>
        <div part="frame">
          <nav part="nav" aria-label="Primary">
            <slot name="nav"></slot>
          </nav>
          <main part="main">
            <slot></slot>
          </main>
          <aside part="aside" aria-label="Context">
            <slot name="aside"></slot>
          </aside>
        </div>
        <footer part="footer">
          <slot name="footer"></slot>
        </footer>
      </section>
    `;
  }
}

export const defineBoxAppShellElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAppShellElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAppShellElement;
  }

  customElements.define(tagName, BoxAppShellElement);
  return BoxAppShellElement;
};
