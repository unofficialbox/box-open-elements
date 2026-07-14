const DEFAULT_TAG_NAME = "box-filter-bar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type FilterBarOption = {
  label: string;
  value: string;
};

type FilterBarState = {
  filters: string[];
  query: string;
  sort: string;
  view: string;
};

export class BoxFilterBarElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["filter-options", "filters", "label", "query", "sort-options", "sort-value", "view-options", "view-value"];
  }

  private queryInternal = "";
  private sortValueInternal = "";
  private viewValueInternal = "";
  private filtersInternal: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Filter Bar";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get query(): string {
    return this.queryInternal;
  }

  set query(value: string) {
    this.queryInternal = value;
    this.setAttribute("query", value);
  }

  get sortValue(): string {
    return this.sortValueInternal;
  }

  set sortValue(value: string) {
    this.sortValueInternal = value;
    this.setAttribute("sort-value", value);
  }

  get viewValue(): string {
    return this.viewValueInternal;
  }

  set viewValue(value: string) {
    this.viewValueInternal = value;
    this.setAttribute("view-value", value);
  }

  get filters(): string[] {
    return this.filtersInternal;
  }

  set filters(value: string[]) {
    this.filtersInternal = value;
    this.setAttribute("filters", JSON.stringify(value));
  }

  get filterOptions(): FilterBarOption[] {
    return this.parseOptionsAttribute("filter-options");
  }

  set filterOptions(value: FilterBarOption[]) {
    this.setAttribute("filter-options", JSON.stringify(value));
  }

  get sortOptions(): FilterBarOption[] {
    return this.parseOptionsAttribute("sort-options");
  }

  set sortOptions(value: FilterBarOption[]) {
    this.setAttribute("sort-options", JSON.stringify(value));
  }

  get viewOptions(): FilterBarOption[] {
    return this.parseOptionsAttribute("view-options");
  }

  set viewOptions(value: FilterBarOption[]) {
    this.setAttribute("view-options", JSON.stringify(value));
  }

  connectedCallback(): void {
    this.syncInternalStateFromAttributes();
    this.render();
  }

  attributeChangedCallback(): void {
    this.syncInternalStateFromAttributes();
    this.render();
  }

  private syncInternalStateFromAttributes(): void {
    this.queryInternal = this.getAttribute("query") ?? "";
    this.sortValueInternal = this.getAttribute("sort-value") ?? "";
    this.viewValueInternal = this.getAttribute("view-value") ?? "";

    const rawFilters = this.getAttribute("filters");
    if (!rawFilters) {
      this.filtersInternal = [];
      return;
    }

    try {
      const parsed = JSON.parse(rawFilters) as string[];
      this.filtersInternal = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.filtersInternal = [];
    }
  }

  private parseOptionsAttribute(name: string): FilterBarOption[] {
    const raw = this.getAttribute(name);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as FilterBarOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private getState(): FilterBarState {
    return {
      query: this.query,
      sort: this.sortValue,
      view: this.viewValue,
      filters: this.filters,
    };
  }

  private emitValueChanged(): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: this.getState() },
      }),
    );
  }

  private renderOptionList(options: FilterBarOption[], selectedValue: string, partName: string): string {
    return options
      .map(
        option => `
          <option value="${escapeHtml(option.value)}" ${selectedValue === option.value ? "selected" : ""}>
            ${escapeHtml(option.label)}
          </option>
        `,
      )
      .join("");
  }

  private renderFilterChips(): string {
    return this.filterOptions
      .map(option => {
        const selected = this.filters.includes(option.value);
        return `
          <button
            type="button"
            part="filter-chip"
            data-value="${escapeHtml(option.value)}"
            aria-pressed="${String(selected)}"
            data-selected="${String(selected)}"
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      })
      .join("");
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

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

        [part="bar"] {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="label"] {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="controls"] {
          display: grid;
          grid-template-columns: minmax(14rem, 1.4fr) repeat(2, minmax(10rem, 0.8fr));
          gap: 0.85rem;
          align-items: center;
        }

        [part="field"],
        [part="select-field"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="field-label"] {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--_obp-text-muted);
        }

        [part="input"],
        [part="select"] {
          width: 100%;
          min-width: 0;
          padding: 0.8rem 0.9rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 0.85rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          box-sizing: border-box;
        }

        [part="filters"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        [part="filter-chip"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.65rem 0.95rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="filter-chip"][data-selected="true"] {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
        }

        [part="input"]:focus-visible,
        [part="select"]:focus-visible,
        [part="filter-chip"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }

        @media (max-width: 900px) {
          [part="controls"] {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <section part="bar" aria-label="${escapeHtml(this.label)}">
        <div part="label">${escapeHtml(this.label)}</div>
        <div part="controls">
          <label part="field">
            <span part="field-label">Search</span>
            <input type="search" part="input" value="${escapeHtml(this.query)}" placeholder="Search items" />
          </label>
          <label part="select-field">
            <span part="field-label">Sort</span>
            <select part="select" data-control="sort">
              ${this.renderOptionList(this.sortOptions, this.sortValue, "sort")}
            </select>
          </label>
          <label part="select-field">
            <span part="field-label">View</span>
            <select part="select" data-control="view">
              ${this.renderOptionList(this.viewOptions, this.viewValue, "view")}
            </select>
          </label>
        </div>
        <div part="filters">
          ${this.renderFilterChips()}
        </div>
      </section>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
      this.queryInternal = (event.currentTarget as HTMLInputElement).value;
      this.emitValueChanged();
    });
    input?.addEventListener("change", () => {
      this.setAttribute("query", this.queryInternal);
      this.dispatchEvent(
        new CustomEvent("search", {
          bubbles: true,
          composed: true,
          detail: { value: this.getState() },
        }),
      );
    });

    this.shadowRoot.querySelectorAll('[part="select"]').forEach(select => {
      select.addEventListener("change", event => {
        const element = event.currentTarget as HTMLSelectElement;
        const control = element.dataset.control;
        if (control === "sort") {
          this.sortValueInternal = element.value;
          this.setAttribute("sort-value", element.value);
        } else if (control === "view") {
          this.viewValueInternal = element.value;
          this.setAttribute("view-value", element.value);
        }
        this.emitValueChanged();
      });
    });

    this.shadowRoot.querySelectorAll('[part="filter-chip"]').forEach(button => {
      button.addEventListener("click", () => {
        const value = (button as HTMLButtonElement).dataset.value ?? "";
        if (!value) {
          return;
        }

        const nextFilters = this.filters.includes(value)
          ? this.filters.filter(entry => entry !== value)
          : [...this.filters, value];
        this.filtersInternal = nextFilters;
        this.setAttribute("filters", JSON.stringify(nextFilters));
        this.emitValueChanged();
      });
    });
  }
}

export const defineBoxFilterBarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxFilterBarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxFilterBarElement;
  }

  customElements.define(tagName, BoxFilterBarElement);
  return BoxFilterBarElement;
};
