const DEFAULT_TAG_NAME = "box-empty-state";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxEmptyStateElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["action-label", "description", "message", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get title(): string {
    return this.getAttribute("title") ?? "Nothing here yet";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description;
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("message") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  get actionLabel(): string {
    return this.getAttribute("action-label") ?? "";
  }

  set actionLabel(value: string) {
    this.setAttribute("action-label", value);
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

    const actionMarkup = this.actionLabel
      ? `<button type="button" part="action">${escapeHtml(this.actionLabel)}</button>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="empty-state"] {
          display: grid;
          justify-items: center;
          gap: 0.55rem;
          padding: 2rem 1.5rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.95rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, white 6%);
          text-align: center;
        }

        [part="title"] {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #222222);
        }

        [part~="message"] {
          max-width: 32rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="action"] {
          appearance: none;
          margin-top: 0.4rem;
          border: 1px solid transparent;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          font-weight: 600;
          padding: 0.58rem 1.05rem;
          cursor: pointer;
          transition: background 140ms ease, transform 140ms ease;
        }

        [part="action"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
        }

        [part="action"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <section part="empty-state" role="status" aria-live="polite">
        <strong part="title">${escapeHtml(this.title)}</strong>
        <span part="message description">${escapeHtml(this.message)}</span>
        ${actionMarkup}
      </section>
    `;

    this.shadowRoot.querySelector('[part="action"]')?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("action", {
          bubbles: true,
          composed: true,
          detail: { action: "primary", label: this.actionLabel },
        }),
      );
    });
  }
}

export const defineBoxEmptyStateElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxEmptyStateElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxEmptyStateElement;
  }

  customElements.define(tagName, BoxEmptyStateElement);
  return BoxEmptyStateElement;
};
