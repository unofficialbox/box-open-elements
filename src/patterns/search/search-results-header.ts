const DEFAULT_TAG_NAME = "box-search-results-header";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type SearchHeaderAction = {
  id: string;
  label: string;
  tone?: string;
};

export class BoxSearchResultsHeaderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "filters", "label", "query", "result-count", "scope", "sort-label", "view-label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): SearchHeaderAction[] {
    return this.parseJsonAttribute<SearchHeaderAction[]>("actions", []);
  }

  set actions(value: SearchHeaderAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get filters(): string[] {
    return this.parseJsonAttribute<string[]>("filters", []);
  }

  set filters(value: string[]) {
    this.setAttribute("filters", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Search Results";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get query(): string {
    return this.getAttribute("query") ?? "";
  }

  set query(value: string) {
    this.setAttribute("query", value);
  }

  get resultCount(): number {
    const raw = this.getAttribute("result-count");
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  set resultCount(value: number) {
    this.setAttribute("result-count", String(value));
  }

  get scope(): string {
    return this.getAttribute("scope") ?? "";
  }

  set scope(value: string) {
    this.setAttribute("scope", value);
  }

  get sortLabel(): string {
    return this.getAttribute("sort-label") ?? "";
  }

  set sortLabel(value: string) {
    this.setAttribute("sort-label", value);
  }

  get viewLabel(): string {
    return this.getAttribute("view-label") ?? "";
  }

  set viewLabel(value: string) {
    this.setAttribute("view-label", value);
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

  private emitFilterRemoved(filter: string): void {
    this.dispatchEvent(
      new CustomEvent("filter-removed", {
        bubbles: true,
        composed: true,
        detail: { filter },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const contextParts = [
      this.query ? `Query: ${this.query}` : "",
      this.scope ? `Scope: ${this.scope}` : "",
      this.sortLabel ? `Sorted by ${this.sortLabel}` : "",
      this.viewLabel ? `View: ${this.viewLabel}` : "",
    ].filter(Boolean);

    const filtersMarkup = this.filters.length
      ? `
          <div part="filters">
            ${this.filters
              .map(
                filter => `
                  <button
                    type="button"
                    part="filter-chip"
                    data-filter="${escapeHtml(filter)}"
                  >
                    ${escapeHtml(filter)}
                  </button>
                `,
              )
              .join("")}
          </div>
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
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
        }

        [part="header"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: start;
          justify-content: space-between;
        }

        [part="meta"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--_obp-text-muted);
        }

        [part="count"] {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.1;
        }

        [part="context"] {
          color: var(--_obp-text-muted);
          line-height: 1.5;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          align-items: center;
          justify-content: flex-end;
        }

        [part="action"],
        [part="filter-chip"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.65rem 0.95rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: var(--_obp-brand);
          background: var(--_obp-brand);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="filters"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        [part="filter-chip"]::after {
          content: " ×";
          color: var(--_obp-text-muted);
        }
      </style>
      <section part="header">
        <div part="topline">
          <div part="meta">
            <div part="label">${escapeHtml(this.label)}</div>
            <div part="count">${escapeHtml(`${this.resultCount} results`)}</div>
            ${contextParts.length ? `<div part="context">${escapeHtml(contextParts.join(" · "))}</div>` : ""}
          </div>
          ${actionsMarkup}
        </div>
        ${filtersMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.getAttribute("data-action-id");
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll<HTMLElement>('[part="filter-chip"]').forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.getAttribute("data-filter");
        if (filter) {
          this.emitFilterRemoved(filter);
        }
      });
    });
  }
}

export const defineBoxSearchResultsHeaderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSearchResultsHeaderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSearchResultsHeaderElement;
  }

  customElements.define(tagName, BoxSearchResultsHeaderElement);
  return BoxSearchResultsHeaderElement;
};
