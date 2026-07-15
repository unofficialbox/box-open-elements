const DEFAULT_TAG_NAME = "box-alert";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxAlertElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["description", "heading", "message", "open", "tone"];
  }

  private openValue = true;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextValue = Boolean(value);
    if (this.openValue === nextValue) {
      return;
    }

    this.openValue = nextValue;
    if (nextValue) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextValue } }));
    this.render();
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
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

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    this.openValue = this.hasAttribute("open") || !this.hasAttribute("open");
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }

    this.render();
  }

  dismiss(): void {
    if (!this.openValue) {
      return;
    }

    this.open = false;
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.openValue || (!this.heading && !this.message)) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    const titleMarkup = this.heading ? `<strong part="title">${escapeHtml(this.heading)}</strong>` : "";
    const messageMarkup = this.message ? `<span part="description message">${escapeHtml(this.message)}</span>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="alert"] {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.85rem 0.95rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, var(--boe-token-surface-surface, #ffffff));
          border-radius: 0.95rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff));
          color: var(--boe-token-text-text, #222222);
          transition: background 140ms ease, border-color 140ms ease;
        }

        [part="alert"][data-tone="success"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 34%, var(--boe-token-surface-surface, #ffffff));
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 12%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="alert"][data-tone="error"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 30%, var(--boe-token-surface-surface, #ffffff));
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="alert"][data-tone="warning"],
        [part="alert"][data-tone="inprogress"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 40%, var(--boe-token-surface-surface, #ffffff));
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 14%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="content"] {
          display: grid;
          gap: 0.25rem;
          line-height: 1.45;
        }

        [part="title"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #222222);
        }

        [part="alert"][data-tone="info"] [part="title"] {
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 78%, var(--boe-token-text-text, #222222));
        }

        [part="alert"][data-tone="success"] [part="title"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 58%, var(--boe-token-text-text, #222222));
        }

        [part="alert"][data-tone="error"] [part="title"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 64%, var(--boe-token-text-text, #222222));
        }

        [part="alert"][data-tone="warning"] [part="title"],
        [part="alert"][data-tone="inprogress"] [part="title"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 46%, var(--boe-token-text-text, #222222));
        }

        [part~="description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="dismiss"] {
          appearance: none;
          flex: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.7rem;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease;
        }

        [part="dismiss"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="dismiss"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="alert" data-tone="${escapeHtml(this.tone)}" role="status" aria-live="polite" aria-label="${escapeHtml(this.heading || this.message)}">
        <div part="content">
          ${titleMarkup}
          ${messageMarkup}
        </div>
        <button type="button" part="dismiss" aria-label="Dismiss alert">Dismiss</button>
      </div>
    `;

    this.shadowRoot.querySelector('[part="dismiss"]')?.addEventListener("click", () => {
      this.dismiss();
    });
  }
}

export const defineBoxAlertElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAlertElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAlertElement;
  }

  customElements.define(tagName, BoxAlertElement);
  return BoxAlertElement;
};
