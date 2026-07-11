const DEFAULT_TAG_NAME = "box-item-details-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ItemDetailsAction = {
  id: string;
  label: string;
  tone?: string;
};

type ItemDetailsMetaItem = {
  label: string;
  value: string;
};

type ItemDetailsOwner = {
  name: string;
  description?: string;
  status?: string;
  initials?: string;
};

export class BoxItemDetailsPanelElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "eyebrow", "message", "meta", "owner", "status", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): ItemDetailsAction[] {
    return this.parseJsonAttribute<ItemDetailsAction[]>("actions", []);
  }

  set actions(value: ItemDetailsAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get meta(): ItemDetailsMetaItem[] {
    return this.parseJsonAttribute<ItemDetailsMetaItem[]>("meta", []);
  }

  set meta(value: ItemDetailsMetaItem[]) {
    this.setAttribute("meta", JSON.stringify(value));
  }

  get owner(): ItemDetailsOwner | null {
    return this.parseJsonAttribute<ItemDetailsOwner | null>("owner", null);
  }

  set owner(value: ItemDetailsOwner | null) {
    if (!value) {
      this.removeAttribute("owner");
      return;
    }

    this.setAttribute("owner", JSON.stringify(value));
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const eyebrowMarkup = this.eyebrow ? `<div part="eyebrow">${escapeHtml(this.eyebrow)}</div>` : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<div part="status">${escapeHtml(this.status)}</div>` : "";
    const owner = this.owner;
    const ownerMarkup = owner
      ? `
          <section part="owner">
            <div part="owner-avatar">${escapeHtml(owner.initials ?? owner.name.slice(0, 2).toUpperCase())}</div>
            <div part="owner-meta">
              <div part="owner-name">${escapeHtml(owner.name)}</div>
              ${owner.description ? `<div part="owner-description">${escapeHtml(owner.description)}</div>` : ""}
              ${owner.status ? `<div part="owner-status">${escapeHtml(owner.status)}</div>` : ""}
            </div>
          </section>
        `
      : "";
    const metaMarkup = this.meta.length
      ? `
          <dl part="meta">
            ${this.meta
              .map(
                item => `
                  <div part="meta-row">
                    <dt part="meta-label">${escapeHtml(item.label)}</dt>
                    <dd part="meta-value">${escapeHtml(item.value)}</dd>
                  </div>
                `,
              )
              .join("")}
          </dl>
        `
      : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button
                    type="button"
                    part="action"
                    data-tone="${escapeHtml(action.tone ?? "neutral")}"
                    data-action-id="${escapeHtml(action.id)}"
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
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #f7f9fc);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #52606d);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, white 88%);
        }

        [part="panel"] {
          display: grid;
          gap: 1rem;
          padding: 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="eyebrow"] {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="header"] {
          display: grid;
          gap: 0.55rem;
        }

        [part="title"] {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.6;
        }

        [part="status"] {
          display: inline-flex;
          width: fit-content;
          padding: 0.45rem 0.7rem;
          border-radius: 999px;
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="owner"] {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.8rem;
          align-items: center;
          padding: 0.9rem;
          border-radius: 0.9rem;
          background: color-mix(in srgb, var(--_obp-surface) 76%, transparent);
          border: 1px solid var(--_obp-border-subtle);
        }

        [part="owner-avatar"] {
          inline-size: 2.8rem;
          block-size: 2.8rem;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: color-mix(in srgb, var(--_obp-brand) 14%, white 86%);
          color: var(--_obp-brand);
          font-weight: 700;
        }

        [part="owner-meta"] {
          display: grid;
          gap: 0.2rem;
        }

        [part="owner-name"] {
          font-weight: 700;
        }

        [part="owner-description"],
        [part="owner-status"] {
          color: var(--_obp-text-muted);
        }

        [part="meta"] {
          display: grid;
          gap: 0.65rem;
          margin: 0;
        }

        [part="meta-row"] {
          display: grid;
          grid-template-columns: minmax(8rem, 0.85fr) minmax(0, 1fr);
          gap: 0.8rem;
          margin: 0;
          padding: 0.75rem 0.85rem;
          border-radius: 0.85rem;
          background: color-mix(in srgb, var(--_obp-surface) 76%, transparent);
          border: 1px solid var(--_obp-border-subtle);
        }

        [part="meta-label"] {
          margin: 0;
          font-weight: 700;
          color: var(--_obp-text-muted);
        }

        [part="meta-value"] {
          margin: 0;
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
          border-color: var(--_obp-brand);
          color: #fff;
        }

        [part="action"]:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      </style>
      <section part="panel">
        <header part="header">
          ${eyebrowMarkup}
          <div part="title">${escapeHtml(this.title)}</div>
          ${messageMarkup}
          ${statusMarkup}
        </header>
        ${ownerMarkup}
        ${metaMarkup}
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
  }
}

export const defineBoxItemDetailsPanelElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxItemDetailsPanelElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxItemDetailsPanelElement;
  }

  customElements.define(tagName, BoxItemDetailsPanelElement);
  return BoxItemDetailsPanelElement;
};
