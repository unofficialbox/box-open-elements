const DEFAULT_TAG_NAME = "box-datalist-item";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * A single selectable row for a picker/typeahead list — a leading glyph, a
 * primary label, and optional secondary meta. It is a `role="option"` (meant to
 * sit inside a host listbox) and emits `select` with its `value` on click or
 * Enter/Space; `selected` reflects to `aria-selected`. The host owns the list
 * and its roving focus.
 */
export class BoxDatalistItemElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "icon", "label", "meta", "selected", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get meta(): string {
    return this.getAttribute("meta") ?? "";
  }

  set meta(value: string) {
    this.setAttribute("meta", value);
  }

  get icon(): string {
    return this.getAttribute("icon") ?? "";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  get value(): string {
    return this.getAttribute("value") ?? this.label;
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

    const iconMarkup = this.icon ? escapeHtml(this.icon) : "";
    const metaMarkup = this.meta ? `<span part="meta">${escapeHtml(this.meta)}</span>` : "";

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

        [part="thumb"] {
          flex: none;
          display: grid;
          place-items: center;
          inline-size: 1.9rem;
          block-size: 1.9rem;
          border-radius: 0.45rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 82%, white 18%);
          color: var(--boe-token-text-text-secondary, #52606d);
          font-weight: 700;
          font-size: 0.85rem;
        }

        [part="body"] {
          min-inline-size: 0;
          display: grid;
          gap: 0.1rem;
        }

        [part="label"] {
          font-size: 0.9rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="meta"] {
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #52606d);
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
        <span part="thumb" aria-hidden="true">${iconMarkup}</span>
        <span part="body">
          <span part="label">${escapeHtml(this.label)}</span>
          ${metaMarkup}
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

export const defineBoxDatalistItemElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDatalistItemElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDatalistItemElement;
  }

  customElements.define(tagName, BoxDatalistItemElement);
  return BoxDatalistItemElement;
};
