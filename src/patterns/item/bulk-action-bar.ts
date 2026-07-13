const DEFAULT_TAG_NAME = "box-bulk-action-bar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BulkAction = {
  id: string;
  label: string;
  tone?: string;
};

type BulkActionItem = {
  description?: string;
  id?: string;
  label: string;
};

export class BoxBulkActionBarElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "clear-label", "count", "items", "label", "message"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): BulkAction[] {
    return this.parseJsonAttribute<BulkAction[]>("actions", []);
  }

  set actions(value: BulkAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get clearLabel(): string {
    return this.getAttribute("clear-label") ?? "Clear selection";
  }

  set clearLabel(value: string) {
    this.setAttribute("clear-label", value);
  }

  get count(): number {
    const raw = this.getAttribute("count");
    if (!raw) {
      return this.items.length;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : this.items.length;
  }

  set count(value: number) {
    this.setAttribute("count", String(value));
  }

  get items(): BulkActionItem[] {
    return this.parseJsonAttribute<BulkActionItem[]>("items", []);
  }

  set items(value: BulkActionItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Bulk actions";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
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
        detail: {
          action: actionId,
          count: this.count,
          items: this.items,
        },
      }),
    );
  }

  private emitClear(): void {
    this.dispatchEvent(
      new CustomEvent("clear", {
        bubbles: true,
        composed: true,
        detail: {
          count: this.count,
          items: this.items,
        },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const count = this.count;
    const summaryText = `${count} selected`;
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const itemsMarkup = this.items.length
      ? `
          <div part="items">
            ${this.items
              .map(
                item => `
                  <div part="item">
                    <span part="item-label">${escapeHtml(item.label)}</span>
                    ${item.description ? `<span part="item-description">${escapeHtml(item.description)}</span>` : ""}
                  </div>
                `,
              )
              .join("")}
          </div>
        `
      : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions" role="toolbar" aria-label="${escapeHtml(this.label)}">
            ${this.actions
              .map(
                action => `
                  <button
                    type="button"
                    part="action"
                    data-action-id="${escapeHtml(action.id)}"
                    data-tone="${escapeHtml(action.tone ?? "neutral")}"
                    aria-label="${escapeHtml(action.label)}"
                  >
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
            <button type="button" part="clear" data-action-id="clear-selection">
              ${escapeHtml(this.clearLabel)}
            </button>
          </div>
        `
      : `
          <div part="actions" role="toolbar" aria-label="${escapeHtml(this.label)}">
            <button type="button" part="clear" data-action-id="clear-selection">
              ${escapeHtml(this.clearLabel)}
            </button>
          </div>
        `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 58%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, white 88%);
        }

        [part="bar"] {
          display: grid;
          gap: 1rem;
          padding: 1rem 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          align-items: center;
          justify-content: space-between;
        }

        [part="summary"] {
          display: grid;
          gap: 0.25rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-brand);
        }

        [part="count"] {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.1;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.55;
        }

        [part="items"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        [part="item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.75rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          background: var(--_obp-surface);
        }

        [part="item-label"] {
          font-weight: 600;
        }

        [part="item-description"] {
          color: var(--_obp-text-muted);
          font-size: 0.92rem;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          align-items: center;
          justify-content: flex-end;
        }

        [part="action"],
        [part="clear"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.7rem 1rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition:
            transform 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        [part="action"][data-tone="primary"] {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
        }

        [part="action"]:hover,
        [part="clear"]:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
        }

        [part="clear"] {
          color: var(--_obp-text-muted);
        }

        @media (max-width: 720px) {
          [part="topline"] {
            align-items: start;
          }

          [part="actions"] {
            justify-content: start;
          }
        }
      </style>
      <section part="bar">
        <div part="topline">
          <div part="summary">
            <div part="label">${escapeHtml(this.label)}</div>
            <div part="count">${escapeHtml(summaryText)}</div>
            ${messageMarkup}
          </div>
          ${actionsMarkup}
        </div>
        ${itemsMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.actionId;
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelector<HTMLElement>('[part="clear"]')?.addEventListener("click", () => {
      this.emitClear();
    });
  }
}

export const defineBoxBulkActionBarElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxBulkActionBarElement);
  }
};
