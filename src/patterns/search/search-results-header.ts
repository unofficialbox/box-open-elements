import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/interaction.js";

const DEFAULT_TAG_NAME = "box-search-results-header";

type SearchHeaderAction = {
  id: string;
  label: string;
  tone?: string;
};


const elementStyles = `
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

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="header"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
          background: var(--_obp-surface-muted);
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
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
          font-size: 1.35rem;
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
          gap: ${boePanel.gap};
          align-items: center;
          justify-content: flex-end;
        }

        [part="action"],
        [part="filter-chip"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.4rem 0.7rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
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

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="filter-chip"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          border-color: var(--_obp-brand);
          background: var(--_obp-brand);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class SearchResultsHeader extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "filters", "label", "query", "result-count", "scope", "sort-label", "view-label"];
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
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

    super.attributeChangedCallback(name, oldValue, newValue);
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

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style>
      <div part="content-host"><section part="header"><div part="topline"><div part="meta">
      <div part="label"></div><div part="count"></div><div part="context" hidden></div></div>
      <div part="actions" hidden></div></div><div part="filters" hidden></div></section></div>`;
  }

  protected setupListeners(): void {
    this.shadowRoot!.querySelector('[part="content-host"]')!.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.getAttribute("part") === "action" && button.dataset.actionId) this.emitAction(button.dataset.actionId);
      if (button.getAttribute("part") === "filter-chip" && button.dataset.filter) this.emitFilterRemoved(button.dataset.filter);
    });
  }

  protected update(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    root.querySelector('[part="label"]')!.textContent = this.label;
    root.querySelector('[part="count"]')!.textContent = `${this.resultCount} results`;
    const parts = [this.query ? `Query: ${this.query}` : "", this.scope ? `Scope: ${this.scope}` : "", this.sortLabel ? `Sorted by ${this.sortLabel}` : "", this.viewLabel ? `View: ${this.viewLabel}` : ""].filter(Boolean);
    const context = root.querySelector<HTMLElement>('[part="context"]')!;
    context.textContent = parts.join(" · "); context.hidden = !parts.length;
    const actions = root.querySelector<HTMLElement>('[part="actions"]')!; actions.hidden = !this.actions.length;
    syncKeyedChildren(actions, this.actions, action => action.id, () => actionButton("action"), (button, action) => { button.dataset.actionId = action.id; button.dataset.tone = action.tone ?? "neutral"; button.textContent = action.label; });
    const filters = root.querySelector<HTMLElement>('[part="filters"]')!; filters.hidden = !this.filters.length;
    syncKeyedChildren(filters, this.filters, filter => filter, () => actionButton("filter-chip"), (button, filter) => { button.dataset.filter = filter; button.textContent = filter; });
  }
}

SearchResultsHeader.register();
