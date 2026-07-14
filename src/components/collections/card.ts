const DEFAULT_TAG_NAME = "box-card";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxCardElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["eyebrow", "heading", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? this.title;
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get title(): string {
    return this.getAttribute("title") ?? this.getAttribute("heading") ?? "";
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

    const eyebrowMarkup = this.eyebrow ? `<span part="eyebrow">${escapeHtml(this.eyebrow)}</span>` : "";
    const title = this.title;
    const headingMarkup = title ? `<strong part="title heading">${escapeHtml(title)}</strong>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="card"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
          border-radius: 1.1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 14px 28px rgba(15, 23, 42, 0.04);
        }

        [part="header"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="eyebrow"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part~="title"] {
          font-size: 1.04rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        [part="body"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.55;
        }
      </style>
      <article part="card">
        <header part="header">
          ${eyebrowMarkup}
          ${headingMarkup}
        </header>
        <div part="body">
          <slot></slot>
        </div>
      </article>
    `;
  }
}

export const defineBoxCardElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCardElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCardElement;
  }

  customElements.define(tagName, BoxCardElement);
  return BoxCardElement;
};
