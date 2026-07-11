const DEFAULT_TAG_NAME = "box-avatar";

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

export class BoxAvatarElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["alt", "initials", "name", "size", "src", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get alt(): string {
    return this.getAttribute("alt") ?? this.name;
  }

  set alt(value: string) {
    this.setAttribute("alt", value);
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
    return Number(this.getAttribute("size") ?? "52");
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

    const size = Math.max(24, this.size);
    const fallback = this.initials || "?";
    const imageMarkup = this.src
      ? `<img part="image" src="${escapeHtml(this.src)}" alt="${escapeHtml(this.alt)}" />`
      : `<span part="fallback">${escapeHtml(fallback)}</span>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="avatar"] {
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 76%, white 24%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-surface-secondary, #f7f9fc) 16%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 10px 20px rgba(15, 23, 42, 0.05);
        }

        [part="avatar"][data-tone="informative"] {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, white 82%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface-secondary, #f7f9fc) 92%) 100%
            );
        }

        [part="avatar"][data-tone="success"] {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, #16a34a 18%, white 82%) 0%,
              color-mix(in srgb, #16a34a 8%, var(--boe-token-surface-surface-secondary, #f7f9fc) 92%) 100%
            );
        }

        [part="image"] {
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        [part="fallback"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #101820);
          letter-spacing: 0.02em;
        }
      </style>
      <div
        part="avatar"
        data-tone="${escapeHtml(this.tone)}"
        aria-label="${escapeHtml(this.alt || fallback)}"
        style="width:${size}px;height:${size}px;"
      >
        ${imageMarkup}
      </div>
    `;
  }
}

export const defineBoxAvatarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAvatarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAvatarElement;
  }

  customElements.define(tagName, BoxAvatarElement);
  return BoxAvatarElement;
};
