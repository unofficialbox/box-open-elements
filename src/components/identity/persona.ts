const DEFAULT_TAG_NAME = "box-persona";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

export class BoxPersonaElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["description", "initials", "name", "size", "src", "status", "subtitle", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get initials(): string {
    return this.getAttribute("initials") ?? initialsFromName(this.name);
  }

  set initials(value: string) {
    this.setAttribute("initials", value);
  }

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get size(): number {
    return Number(this.getAttribute("size") ?? "48");
  }

  set size(value: number) {
    this.setAttribute("size", String(value));
  }

  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get subtitle(): string {
    return this.getAttribute("subtitle") ?? this.description;
  }

  set subtitle(value: string) {
    this.setAttribute("subtitle", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("subtitle") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
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

    const size = Math.max(32, this.size);
    const imageMarkup = this.src
      ? `<img part="image" src="${escapeHtml(this.src)}" alt="${escapeHtml(this.name)}" />`
      : `<span part="fallback">${escapeHtml(this.initials || "?")}</span>`;
    const description = this.description;
    const subtitleMarkup = description ? `<span part="description subtitle">${escapeHtml(description)}</span>` : "";
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="persona"] {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.85rem;
          padding: 0.8rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, white 20%);
          border-radius: 1rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
            );
        }

        [part="avatar"] {
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 76%, white 24%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%) 100%
            );
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        [part="image"] {
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        [part="fallback"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #222222);
        }

        [part="meta"] {
          min-inline-size: 0;
          display: grid;
          gap: 0.2rem;
        }

        [part="name"] {
          font-size: 0.98rem;
          line-height: 1.25;
        }

        [part~="description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.45;
        }

        [part="status"] {
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 78%, white 22%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.8rem;
          font-weight: 700;
        }
      </style>
      <div part="persona">
        <div part="avatar" data-tone="${escapeHtml(this.tone)}" style="width:${size}px;height:${size}px;">
          ${imageMarkup}
        </div>
        <div part="meta">
          <strong part="name">${escapeHtml(this.name)}</strong>
          ${subtitleMarkup}
        </div>
        ${statusMarkup}
      </div>
    `;
  }
}

export const defineBoxPersonaElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPersonaElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPersonaElement;
  }

  customElements.define(tagName, BoxPersonaElement);
  return BoxPersonaElement;
};
