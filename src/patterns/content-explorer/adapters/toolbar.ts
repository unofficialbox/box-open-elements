import { ContentExplorerController } from "../controller.js";
import { BaseElement } from "../../../core/index.js";
import {
  BoxSearchFieldElement,
  defineBoxSearchFieldElement,
} from "../../../components/forms/search-field.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../../foundations/a11y/index.js";
import { boeNeutralInteractiveStyles } from "../../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-explorer-toolbar";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="toolbar"] {
          display: flex;
          flex-wrap: wrap;
          align-items: end;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          border-radius: 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        [part="search"] {
          flex: 1 1 14rem;
          min-width: 12rem;
        }

        [part="status"],
        [part="selection-count"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.85rem;
          white-space: nowrap;
          padding-bottom: 0.45rem;
        }

        [part="selection-count"] {
          margin-right: auto;
        }

        [part="status"][data-status="failed"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
        }

        [part="refresh"],
        [part="clear-selection"] {
          appearance: none;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 0.42rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        ${boeNeutralInteractiveStyles('[part="refresh"]')}
        ${boeNeutralInteractiveStyles('[part="clear-selection"]')}
      `;

export class BoxExplorerToolbarElement extends BaseElement {
  private controllerValue: ContentExplorerController | null = null;

  private unsubscribeFns: Array<() => void> = [];

  private listenersBound = false;

  get controller(): ContentExplorerController | null {
    return this.controllerValue;
  }

  set controller(value: ContentExplorerController | null) {
    this.controllerValue = value;
    this.bindController();
    if (this.isRendered) {
      this.update();
    }
  }

  connectedCallback(): void {
    defineBoxSearchFieldElement();
    this.bindController();
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    this.teardownSubscriptions();
  }

  private bindController(): void {
    this.teardownSubscriptions();

    if (!this.isConnected || !this.controllerValue) {
      return;
    }

    for (const eventName of [
      "loadingChanged",
      "selectionChanged",
      "loadFailed",
      "viewChanged",
      "searchSucceeded",
      "loadSucceeded",
    ] as const) {
      this.unsubscribeFns.push(
        this.controllerValue.subscribe(eventName, payload => {
          this.dispatchEvent(
            new CustomEvent(toKebabCase(String(eventName)), {
              bubbles: true,
              composed: true,
              detail: payload,
            }),
          );
          if (this.isRendered) {
            this.update();
          }
        }),
      );
    }
  }

  private teardownSubscriptions(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];
  }

  private getSearchField(): BoxSearchFieldElement | null {
    return this.shadowRoot?.querySelector('[part="search"]') as BoxSearchFieldElement | null;
  }

  private syncSearchField(query: string, loading: boolean): void {
    const searchField = this.getSearchField();
    if (!searchField) {
      return;
    }

    const active = this.shadowRoot?.activeElement;
    const searchFocused =
      active === searchField || (active != null && searchField.contains(active));

    if (!searchFocused && searchField.value !== query) {
      searchField.value = query;
    }

    searchField.disabled = loading;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    defineBoxSearchFieldElement();

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="toolbar" role="toolbar" aria-label="Explorer toolbar">
        <box-search-field
          part="search"
          label="Search"
          placeholder="Search files and folders"
        ></box-search-field>
        <span part="status" data-status="ready" role="status" aria-live="polite">ready</span>
        <span part="selection-count">0 selected</span>
        <button type="button" part="refresh">Refresh</button>
        <button type="button" part="clear-selection" disabled>Clear Selection</button>
      </div>
    `;
    this.listenersBound = false;
  }

  protected setupListeners(): void {
    if (!this.shadowRoot || this.listenersBound) {
      return;
    }

    this.listenersBound = true;
    const toolbar = this.shadowRoot.querySelector('[part="toolbar"]');
    const searchField = this.getSearchField();

    searchField?.addEventListener("search", event => {
      const value = String((event as CustomEvent<{ value?: string }>).detail?.value ?? "").trim();
      if (value) {
        void this.controllerValue?.search(value);
      } else {
        void this.controllerValue?.clearSearch();
      }
    });

    searchField?.addEventListener("clear", () => {
      void this.controllerValue?.clearSearch();
    });

    this.shadowRoot.querySelector('[part="refresh"]')?.addEventListener("click", () => {
      void this.controllerValue?.refresh();
    });

    this.shadowRoot.querySelector('[part="clear-selection"]')?.addEventListener("click", () => {
      this.controllerValue?.clearSelection();
    });

    toolbar?.addEventListener("keydown", event => {
      const buttons = Array.from(
        this.shadowRoot?.querySelectorAll<HTMLButtonElement>(
          '[part="refresh"], [part="clear-selection"]',
        ) ?? [],
      ).filter(button => !button.disabled);
      handleRovingKeydown(event as KeyboardEvent, buttons, { orientation: "horizontal" });
    });
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controllerValue?.getState();
    const loading = state?.loading ?? false;
    const selectedCount = state?.selectedItemIds.length ?? 0;
    const hasError = Boolean(state?.error);
    const statusText = loading ? "loading" : hasError ? "failed" : "ready";
    const searchQuery = state?.view.searchQuery ?? "";

    const status = this.shadowRoot.querySelector('[part="status"]') as HTMLElement | null;
    const selectionCount = this.shadowRoot.querySelector(
      '[part="selection-count"]',
    ) as HTMLElement | null;
    const refresh = this.shadowRoot.querySelector('[part="refresh"]') as HTMLButtonElement | null;
    const clearSelection = this.shadowRoot.querySelector(
      '[part="clear-selection"]',
    ) as HTMLButtonElement | null;

    if (status) {
      status.dataset.status = statusText;
      status.textContent = statusText;
    }

    if (selectionCount) {
      selectionCount.textContent = `${selectedCount} selected`;
    }

    if (refresh) {
      refresh.disabled = loading;
    }

    if (clearSelection) {
      clearSelection.disabled = selectedCount === 0;
    }

    this.syncSearchField(searchQuery, loading);

    const activePart = this.shadowRoot.activeElement?.getAttribute("part") ?? null;
    const buttons = Array.from(
      this.shadowRoot.querySelectorAll<HTMLButtonElement>(
        '[part="refresh"], [part="clear-selection"]',
      ),
    ).filter(button => !button.disabled);
    const restoreIndex = activePart
      ? buttons.findIndex(button => button.getAttribute("part") === activePart)
      : -1;
    applyRovingTabindex(buttons, restoreIndex >= 0 ? restoreIndex : 0);
  }
}

export const defineBoxExplorerToolbarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerToolbarElement => {
  defineBoxSearchFieldElement();
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerToolbarElement;
  }

  customElements.define(tagName, BoxExplorerToolbarElement);
  return BoxExplorerToolbarElement;
};
