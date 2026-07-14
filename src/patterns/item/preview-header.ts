const DEFAULT_TAG_NAME = "box-preview-header";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PreviewHeaderAction = {
  id: string;
  label: string;
  tone?: string;
};

type PreviewHeaderBreadcrumb = {
  id: string;
  label: string;
};

export class BoxPreviewHeaderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "breadcrumbs", "message", "status", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): PreviewHeaderAction[] {
    return this.parseJsonAttribute<PreviewHeaderAction[]>("actions", []);
  }

  set actions(value: PreviewHeaderAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get breadcrumbs(): PreviewHeaderBreadcrumb[] {
    return this.parseJsonAttribute<PreviewHeaderBreadcrumb[]>("breadcrumbs", []);
  }

  set breadcrumbs(value: PreviewHeaderBreadcrumb[]) {
    this.setAttribute("breadcrumbs", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get title(): string {
    return this.getAttribute("title") ?? "";
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

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private emitAction(actionId: string): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: { action: actionId },
      }),
    );
  }

  private emitBreadcrumbSelected(id: string): void {
    this.dispatchEvent(
      new CustomEvent("breadcrumb-selected", {
        bubbles: true,
        composed: true,
        detail: { id },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const breadcrumbsMarkup = this.breadcrumbs.length
      ? `
          <nav part="breadcrumbs" aria-label="Preview breadcrumbs">
            ${this.breadcrumbs
              .map(
                crumb => `
                  <button type="button" part="breadcrumb" data-crumb-id="${escapeHtml(crumb.id)}">
                    ${escapeHtml(crumb.label)}
                  </button>
                `,
              )
              .join('<span part="separator">/</span>')}
          </nav>
        `
      : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<div part="status">${escapeHtml(this.status)}</div>` : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button
                    type="button"
                    part="action"
                    data-action-id="${escapeHtml(action.id)}"
                    data-tone="${escapeHtml(action.tone ?? "neutral")}"
                  >
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, white 88%);
        }

        [part="header"] {
          display: grid;
          gap: 0.9rem;
          padding: 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="breadcrumbs"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        [part="breadcrumb"] {
          border: none;
          padding: 0;
          background: none;
          color: var(--_obp-text-muted);
          font: inherit;
          cursor: pointer;
        }

        [part="separator"] {
          color: color-mix(in srgb, var(--_obp-text-muted) 62%, transparent);
        }

        [part="main"] {
          display: grid;
          gap: 0.55rem;
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }

        [part="title"] {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="status"] {
          display: inline-flex;
          padding: 0.42rem 0.7rem;
          border-radius: 999px;
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.6;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        [part="action"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.75rem 1rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          background: var(--_obp-brand);
          color: #fff;
          border-color: var(--_obp-brand);
        }

        [part="action"]:focus-visible,
        [part="breadcrumb"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }
      </style>
      <section part="header">
        ${breadcrumbsMarkup}
        <div part="main">
          <div part="title-row">
            <div part="title">${escapeHtml(this.title)}</div>
            ${statusMarkup}
          </div>
          ${messageMarkup}
        </div>
        ${actionsMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = (button as HTMLButtonElement).dataset.actionId ?? "";
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part="breadcrumb"]').forEach(button => {
      button.addEventListener("click", () => {
        const id = (button as HTMLButtonElement).dataset.crumbId ?? "";
        if (id) {
          this.emitBreadcrumbSelected(id);
        }
      });
    });
  }
}

export const defineBoxPreviewHeaderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPreviewHeaderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPreviewHeaderElement;
  }

  customElements.define(tagName, BoxPreviewHeaderElement);
  return BoxPreviewHeaderElement;
};
