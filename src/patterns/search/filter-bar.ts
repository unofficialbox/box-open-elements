import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

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


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
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
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
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
          gap: ${boePanel.gap};
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
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 0.55rem;
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
          padding: 0.4rem 0.7rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="input"]')}
        ${boeNeutralInteractiveStyles('[part="select"]')}
        ${boeNeutralInteractiveStyles('[part="filter-chip"]')}

        [part="filter-chip"][data-selected="true"],
        [part="filter-chip"][data-selected="true"]:hover:not(:disabled),
        [part="filter-chip"][data-selected="true"]:active:not(:disabled) {
          border-color: color-mix(in srgb, var(--_obp-brand) 34%, transparent);
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
        }

        @media (max-width: 900px) {
          [part="controls"] {
            grid-template-columns: 1fr;
          }
        }
      `;

export class BoxFilterBarElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["filter-options", "filters", "label", "query", "sort-options", "sort-value", "view-options", "view-value"];
  }

  private queryInternal = "";
  private sortValueInternal = "";
  private viewValueInternal = "";
  private filtersInternal: string[] = [];
  private labelEl!: HTMLElement;
  private barEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private sortEl!: HTMLSelectElement;
  private viewEl!: HTMLSelectElement;
  private filtersEl!: HTMLElement;
  private optionsSignature = "";

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
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    this.syncInternalStateFromAttributes();

    super.attributeChangedCallback(name, oldValue, newValue);
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

  private renderOptionList(options: FilterBarOption[], selectedValue: string): string {
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

  private optionsKey(): string {
    return JSON.stringify({
      filterOptions: this.filterOptions,
      sortOptions: this.sortOptions,
      viewOptions: this.viewOptions,
    });
  }

  private rebuildOptionControls(): void {
    this.sortEl.innerHTML = this.renderOptionList(this.sortOptions, this.sortValue);
    this.viewEl.innerHTML = this.renderOptionList(this.viewOptions, this.viewValue);
    this.filtersEl.innerHTML = this.filterOptions
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

  private patchChips(): void {
    this.filtersEl.querySelectorAll('[part="filter-chip"]').forEach(button => {
      const chip = button as HTMLButtonElement;
      const selected = this.filters.includes(chip.dataset.value ?? "");
      chip.setAttribute("aria-pressed", String(selected));
      chip.dataset.selected = String(selected);
    });
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="bar" aria-label="">
        <div part="label"></div>
        <div part="controls">
          <label part="field">
            <span part="field-label">Search</span>
            <input type="search" part="input" placeholder="Search items" />
          </label>
          <label part="select-field">
            <span part="field-label">Sort</span>
            <select part="select" data-control="sort"></select>
          </label>
          <label part="select-field">
            <span part="field-label">View</span>
            <select part="select" data-control="view"></select>
          </label>
        </div>
        <div part="filters"></div>
      </section>
    `;
    this.barEl = this.shadowRoot.querySelector('[part="bar"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.sortEl = this.shadowRoot.querySelector('[data-control="sort"]')!;
    this.viewEl = this.shadowRoot.querySelector('[data-control="view"]')!;
    this.filtersEl = this.shadowRoot.querySelector('[part="filters"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      this.queryInternal = (event.currentTarget as HTMLInputElement).value;
      this.emitValueChanged();
    });
    this.inputEl.addEventListener("change", () => {
      this.setAttribute("query", this.queryInternal);
      this.dispatchEvent(
        new CustomEvent("search", {
          bubbles: true,
          composed: true,
          detail: { value: this.getState() },
        }),
      );
    });

    this.sortEl.addEventListener("change", event => {
      const element = event.currentTarget as HTMLSelectElement;
      this.sortValueInternal = element.value;
      this.setAttribute("sort-value", element.value);
      this.emitValueChanged();
    });

    this.viewEl.addEventListener("change", event => {
      const element = event.currentTarget as HTMLSelectElement;
      this.viewValueInternal = element.value;
      this.setAttribute("view-value", element.value);
      this.emitValueChanged();
    });

    this.filtersEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="filter-chip"]') as HTMLButtonElement | null;
      if (!button || !this.filtersEl.contains(button)) {
        return;
      }

      const value = button.dataset.value ?? "";
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
  }

  protected update(): void {
    if (!this.labelEl || !this.inputEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.barEl.setAttribute("aria-label", this.label);

    const active = this.shadowRoot?.activeElement;
    if (active !== this.inputEl) {
      this.inputEl.value = this.query;
    }
    if (active !== this.sortEl) {
      this.sortEl.value = this.sortValue;
    }
    if (active !== this.viewEl) {
      this.viewEl.value = this.viewValue;
    }

    const nextOptions = this.optionsKey();
    if (nextOptions !== this.optionsSignature) {
      this.optionsSignature = nextOptions;
      this.rebuildOptionControls();
      return;
    }

    this.patchChips();
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
