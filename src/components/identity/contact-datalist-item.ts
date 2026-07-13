const DEFAULT_TAG_NAME = "box-contact-datalist-item";

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

/**
 * A selectable contact row for a people picker — an avatar (image or initials),
 * a name, and a secondary email/handle. Like `box-datalist-item` it is a
 * `role="option"` that emits `select` with its `value` on click or Enter/Space
 * and reflects `selected` to `aria-selected`; the host owns the list.
 */
export class BoxContactDatalistItemElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "email", "name", "selected", "src", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get email(): string {
    return this.getAttribute("email") ?? "";
  }

  set email(value: string) {
    this.setAttribute("email", value);
  }

  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? this.email ?? this.name;
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    this.toggleAttribute("selected", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private choose(): void {
    if (this.disabled) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const avatarMarkup = this.src
      ? `<img part="avatar-image" src="${escapeHtml(this.src)}" alt="" />`
      : `<span part="avatar-fallback">${escapeHtml(initialsFromName(this.name) || "?")}</span>`;
    const emailMarkup = this.email ? `<span part="email">${escapeHtml(this.email)}</span>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="item"] {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.5rem 0.65rem;
          border-radius: 0.6rem;
          cursor: pointer;
          color: var(--boe-token-text-text, #101820);
          transition: background 140ms ease;
        }

        [part="item"]:hover {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="item"][data-selected="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, white 90%);
        }

        [part="item"][data-disabled="true"] {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part="item"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="avatar"] {
          flex: none;
          display: grid;
          place-items: center;
          overflow: hidden;
          inline-size: 2.1rem;
          block-size: 2.1rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #101820));
          font-weight: 700;
          font-size: 0.82rem;
        }

        [part="avatar-image"] {
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        [part="body"] {
          min-inline-size: 0;
          display: grid;
          gap: 0.1rem;
        }

        [part="name"] {
          font-size: 0.9rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="email"] {
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #52606d);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      </style>
      <div
        part="item"
        role="option"
        aria-selected="${this.selected ? "true" : "false"}"
        ${this.disabled ? 'aria-disabled="true"' : ""}
        data-selected="${this.selected ? "true" : "false"}"
        data-disabled="${this.disabled ? "true" : "false"}"
        tabindex="${this.disabled ? "-1" : "0"}"
      >
        <span part="avatar" aria-hidden="true">${avatarMarkup}</span>
        <span part="body">
          <span part="name">${escapeHtml(this.name)}</span>
          ${emailMarkup}
        </span>
      </div>
    `;

    const item = this.shadowRoot.querySelector('[part="item"]') as HTMLElement | null;
    item?.addEventListener("click", () => this.choose());
    item?.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.choose();
      }
    });
  }
}

export const defineBoxContactDatalistItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxContactDatalistItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxContactDatalistItemElement;
  }

  customElements.define(tagName, BoxContactDatalistItemElement);
  return BoxContactDatalistItemElement;
};
