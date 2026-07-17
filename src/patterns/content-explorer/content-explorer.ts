import { ContentExplorerController } from "./controller.js";
import {
  resolveExplorerItemGesture,
  shouldActivateOnClick,
  shouldToggleOnEnter,
  type ExplorerEvents,
  type ExplorerItemAction,
  type ExplorerItem,
  type ExplorerSessionConfig,
  type ExplorerItemGesture,
  type ExplorerSelectionMode,
  type ExplorerState,
  type ExplorerTransport,
} from "./types.js";
import { formatItemMetaLine } from "./adapters/item-summary.js";
import {
  defineBoxSearchResultsHeaderElement,
  type BoxSearchResultsHeaderElement,
} from "../search/search-results-header.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-content-explorer";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toAttributeString = (attributes: Record<string, string>): string =>
  Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(" ");

const readPositiveNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export interface BoxContentExplorerTemplateContext {
  element: BoxContentExplorerElement;
  state: Readonly<ExplorerState> | null;
}

export interface BoxContentExplorerFolderTemplateArgs extends BoxContentExplorerTemplateContext {
  breadcrumbsMarkup: string;
}

export interface BoxContentExplorerBreadcrumbTemplateArgs extends BoxContentExplorerTemplateContext {
  buttonAttributes: string;
  id: string;
  name: string;
}

export interface BoxContentExplorerItemActionTemplateArgs extends BoxContentExplorerTemplateContext {
  action: ExplorerItemAction;
  buttonAttributes: string;
  item: ExplorerItem;
}

export interface BoxContentExplorerItemTemplateArgs extends BoxContentExplorerTemplateContext {
  isSelected: boolean;
  item: ExplorerItem;
  itemActionsMarkup: string;
  itemButtonAttributes: string;
}

export interface BoxContentExplorerTemplates {
  renderBreadcrumb?: (args: BoxContentExplorerBreadcrumbTemplateArgs) => string;
  renderFolder?: (args: BoxContentExplorerFolderTemplateArgs) => string;
  renderItem?: (args: BoxContentExplorerItemTemplateArgs) => string;
  renderItemAction?: (args: BoxContentExplorerItemActionTemplateArgs) => string;
}


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        section {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          transition: opacity ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        section[aria-busy="true"] {
          opacity: 0.65;
        }

        [part="folder"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="folder"] h2 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--boe-token-text-text, #222222);
        }

        [part="folder"] p {
          margin: 0;
          font-size: 0.8rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="breadcrumbs"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.2rem;
        }

        [part="breadcrumb"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          padding: 0.25rem 0.55rem;
          border: none;
          border-radius: 0.55rem;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="breadcrumb"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="breadcrumb"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="breadcrumb-separator"] {
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 55%, transparent);
          font-size: 0.875rem;
        }

        [part="status"] {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="error"] {
          margin: 0;
          padding: 0.55rem 0.7rem;
          border-radius: 0.65rem;
          font-size: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff));
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 34%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
        }

        [part="refresh"],
        [part="load-more"],
        [part="item-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          border-radius: 0.55rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="refresh"] {
          justify-self: start;
        }

        [part="refresh"]:hover:not(:disabled),
        [part="load-more"]:hover,
        [part="item-action"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="refresh"]:focus-visible,
        [part="load-more"]:focus-visible,
        [part="item-action"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="refresh"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="items"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 62%, transparent);
          border-radius: ${boePanel.radius};
          overflow: hidden;
        }

        [part="items"] > li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${boePanel.gap};
          padding: 0.15rem 0.45rem;
          background: var(--boe-token-surface-surface, #ffffff);
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="items"] > li + li {
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 46%, transparent);
        }

        [part="items"] > li:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="items"] > li:has([part="item"][aria-selected="true"]) {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part="item"] {
          appearance: none;
          font: inherit;
          font-size: 0.95rem;
          flex: 1;
          display: grid;
          gap: 0.15rem;
          text-align: left;
          padding: 0.45rem 0.45rem;
          border: none;
          border-radius: 0.55rem;
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition: color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="item-name"] {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="item-meta"] {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.78rem;
          font-weight: 400;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="item"]:hover {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="item"][aria-selected="true"] {
          font-weight: 600;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item-actions"] {
          display: flex;
          gap: 0.4rem;
        }

        [part="item-action"] {
          font-size: 0.8rem;
          padding: 0.35rem 0.7rem;
        }

        [part="load-more-region"] {
          display: flex;
          justify-content: center;
        }
      `;

export class BoxContentExplorerElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["item-gesture", "language", "page-size", "root-folder-id", "search-query", "selection-mode", "token"];
  }

  private controller: ContentExplorerController | null = null;

  private pendingStart = false;

  private focusItemId: string | null = null;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: ExplorerTransport | null = null;

  private itemActionsValue: ExplorerItemAction[] = [];

  private templatesValue: BoxContentExplorerTemplates = {};
  get language(): string | null {
    return this.getAttribute("language");
  }

  set language(value: string | null) {
    this.updateStringAttribute("language", value);
  }

  get pageSize(): number | undefined {
    return readPositiveNumber(this.getAttribute("page-size"));
  }

  get selectionMode(): ExplorerSelectionMode | null {
    const value = this.getAttribute("selection-mode");
    return value === "single" || value === "multiple" ? value : null;
  }

  set selectionMode(value: ExplorerSelectionMode | null) {
    this.updateStringAttribute("selection-mode", value);
  }

  get itemGesture(): ExplorerItemGesture {
    return resolveExplorerItemGesture(this.getAttribute("item-gesture"));
  }

  set itemGesture(value: ExplorerItemGesture) {
    this.setAttribute("item-gesture", value);
  }

  set pageSize(value: number | undefined) {
    if (typeof value === "number" && value > 0) {
      this.setAttribute("page-size", String(value));
      return;
    }

    this.removeAttribute("page-size");
  }

  get rootFolderId(): string | null {
    return this.getAttribute("root-folder-id");
  }

  set rootFolderId(value: string | null) {
    this.updateStringAttribute("root-folder-id", value);
  }

  get token(): string | null {
    return this.getAttribute("token");
  }

  set token(value: string | null) {
    this.updateStringAttribute("token", value);
  }

  get transport(): ExplorerTransport | null {
    return this.transportValue;
  }

  set transport(value: ExplorerTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  get itemActions(): ExplorerItemAction[] {
    return this.itemActionsValue;
  }

  set itemActions(value: ExplorerItemAction[]) {
    this.itemActionsValue = value;
    this.scheduleStart();
  }

  get templates(): BoxContentExplorerTemplates {
    return this.templatesValue;
  }

  set templates(value: BoxContentExplorerTemplates) {
    this.templatesValue = value;
    if (this.isRendered) {
      this.update();
    }
  }

  get state(): Readonly<ExplorerState> | null {
    return this.controller?.getState() ?? null;
  }

  get searchQuery(): string | null {
    return this.getAttribute("search-query");
  }

  set searchQuery(value: string | null) {
    this.updateStringAttribute("search-query", value);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Presentation-only attrs must not tear down the session.
    if (name !== "item-gesture" && name !== "search-query") {
      this.scheduleStart();
    }
    if (name === "search-query" && this.controller && oldValue !== newValue) {
      const query = newValue?.trim() ?? "";
      const current = this.controller.getState().view.searchQuery?.trim() ?? "";
      const inFolder = this.controller.getState().view.mode === "folder";
      if (query !== current && !(query === "" && inFolder)) {
        void (query ? this.controller.search(query) : this.controller.clearSearch());
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  async loadNextPage(): Promise<void> {
    await this.controller?.loadNextPage();
  }

  async refresh(): Promise<void> {
    await this.controller?.refresh();
  }

  async activateItem(itemId: string): Promise<void> {
    await this.controller?.activateItem(itemId);
  }

  async navigateTo(folderId: string): Promise<void> {
    await this.controller?.navigateTo(folderId);
  }

  async search(query: string): Promise<void> {
    await this.controller?.search(query);
  }

  async clearSearch(): Promise<void> {
    await this.controller?.clearSearch();
  }

  select(itemIds: string[]): void {
    this.controller?.select(itemIds);
  }

  toggleSelection(itemId: string): void {
    this.controller?.toggleSelection(itemId);
  }

  clearSelection(): void {
    this.controller?.clearSelection();
  }

  invokeItemAction(itemId: string, actionId: string): void {
    this.controller?.invokeItemAction(itemId, actionId);
  }

  private updateStringAttribute(name: string, value: string | null): void {
    if (value === null || value === "") {
      this.removeAttribute(name);
      return;
    }

    this.setAttribute(name, value);
  }

  private scheduleStart(): void {
    if (this.pendingStart) {
      return;
    }

    this.pendingStart = true;
    queueMicrotask(() => {
      this.pendingStart = false;
      void this.startController();
    });
  }

  private async startController(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    const config = this.readConfig();
    if (!config) {
      this.teardownController();
      if (this.isRendered) {
        this.update();
      }
      return;
    }

    const initialSearchQuery = this.searchQuery?.trim() ?? "";
    this.teardownController();
    const controller = new ContentExplorerController(config);
    this.controller = controller;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
    await controller.connect();
    if (this.controller === controller && initialSearchQuery) {
      await controller.search(initialSearchQuery);
    }
  }

  private readConfig(): ExplorerSessionConfig | null {
    if (!this.transportValue || !this.rootFolderId || !this.token) {
      return null;
    }

    return {
      language: this.language ?? undefined,
      pageSize: this.pageSize,
      rootFolderId: this.rootFolderId,
      selectionMode: this.selectionMode ?? undefined,
      token: this.token,
      itemActions: this.itemActionsValue,
      transport: this.transportValue,
    };
  }

  private subscribeToController(controller: ContentExplorerController): void {
    const eventNames: Array<keyof ExplorerEvents> = [
      "breadcrumbsChanged",
      "connected",
      "disconnected",
      "folderChanged",
      "folderLoaded",
      "itemActivated",
      "itemActionInvoked",
      "itemsChanged",
      "loadFailed",
      "loadSucceeded",
      "loadingChanged",
      "paginationChanged",
      "searchSucceeded",
      "selectionChanged",
      "viewChanged",
    ];

    this.unsubscribeFns = eventNames.map(eventName =>
      controller.subscribe(eventName, payload => {
        if (eventName === "viewChanged" || eventName === "searchSucceeded" || eventName === "loadSucceeded") {
          const query = controller.getState().view.searchQuery;
          if (query) {
            this.setAttribute("search-query", query);
          } else if (this.hasAttribute("search-query")) {
            this.removeAttribute("search-query");
          }
        }
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

  private teardownController(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];

    this.controller?.destroy();
    this.controller = null;
  }

  private getFocusableItemIds(): string[] {
    return this.controller?.getState().items.map(item => item.id) ?? [];
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controller?.getState();
    const breadcrumbMarkup = state?.breadcrumbs.length
      ? `<nav part="breadcrumbs" aria-label="Breadcrumbs">${state.breadcrumbs
          .map(
            crumb => {
              const buttonAttributes = toAttributeString({
                "aria-label": `Open ${crumb.name}`,
                "data-folder-id": crumb.id,
                part: "breadcrumb",
                type: "button",
              });
              return this.templatesValue.renderBreadcrumb
                ? this.templatesValue.renderBreadcrumb({
                    buttonAttributes,
                    element: this,
                    id: crumb.id,
                    name: crumb.name,
                    state,
                  })
                : `<button ${buttonAttributes}>${escapeHtml(crumb.name)}</button>`;
            },
          )
          .join('<span part="breadcrumb-separator">/</span>')}</nav>`
      : "";
    const isSearch = state?.view.mode === "search";
    const searchResultCount = state?.pagination.totalCount ?? state?.items.length ?? 0;
    const searchScope = state?.currentFolder?.name ?? "";
    const folderMarkup = isSearch
      ? `<header part="folder" data-view="search">
          ${breadcrumbMarkup}
          <box-search-results-header
            part="search-results-header"
            label="Search results"
            query="${escapeHtml(state.view.searchQuery ?? "")}"
            result-count="${escapeHtml(String(searchResultCount))}"
            scope="${escapeHtml(searchScope)}"
            actions='[{"id":"clear-search","label":"Clear search"}]'
          ></box-search-results-header>
        </header>`
      : state?.currentFolder
        ? this.templatesValue.renderFolder
          ? this.templatesValue.renderFolder({
              breadcrumbsMarkup: breadcrumbMarkup,
              element: this,
              state,
            })
          : `<header part="folder">${breadcrumbMarkup}<h2>${escapeHtml(state.currentFolder.name)}</h2><p>${escapeHtml(state.currentFolder.id)}</p></header>`
        : `<header part="folder"><h2>No folder loaded</h2></header>`;
    const itemsMarkup = state?.items.length
      ? state.items
          .map(
            item => {
              const isSelected = state.selectedItemIds.includes(item.id);
              const focusTarget = this.focusItemId ?? state.items[0]?.id ?? "";
              const meta = formatItemMetaLine(item);
              const actions = (state.availableActionsByItemId[item.id] ?? [])
                .map(
                  action => {
                    const buttonAttributes = toAttributeString({
                      "aria-label": `${action.label} ${item.name}`,
                      "data-action-id": action.id,
                      "data-item-id": item.id,
                      part: "item-action",
                      type: "button",
                    });
                    return this.templatesValue.renderItemAction
                      ? this.templatesValue.renderItemAction({
                          action,
                          buttonAttributes,
                          element: this,
                          item,
                          state,
                        })
                      : `<button ${buttonAttributes}>${escapeHtml(action.label)}</button>`;
                  },
                )
                .join("");
              const itemButtonAttributes = toAttributeString({
                "aria-label": item.name,
                "aria-selected": isSelected ? "true" : "false",
                "data-item-id": item.id,
                part: "item",
                role: "option",
                tabindex: item.id === focusTarget ? "0" : "-1",
                type: "button",
              });

              return this.templatesValue.renderItem
                ? this.templatesValue.renderItem({
                    element: this,
                    isSelected,
                    item,
                    itemActionsMarkup: actions ? `<div part="item-actions">${actions}</div>` : "",
                    itemButtonAttributes,
                    state,
                  })
                : `<li data-item-id="${item.id}" role="presentation">
                    <button ${itemButtonAttributes}><span part="item-name">${escapeHtml(item.name)}</span>${
                      meta ? `<span part="item-meta">${escapeHtml(meta)}</span>` : ""
                    }</button>
                    ${actions ? `<div part="item-actions">${actions}</div>` : ""}
                  </li>`;
            },
          )
          .join("")
      : `<li role="presentation">No items loaded</li>`;
    const loadMoreMarkup =
      state?.pagination.hasMoreItems && !state.loading
        ? `<button type="button" part="load-more">Load more</button>`
        : "";
    const refreshDisabled = state?.loading ? "disabled" : "";
    const errorMarkup = state?.error ? `<p part="error">${escapeHtml(state.error.message)}</p>` : "";
    const statusText = state
      ? state.loading
        ? "loading"
        : "ready"
      : "idle";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <section aria-busy="${state?.loading ? "true" : "false"}">
        ${folderMarkup}
        <p part="status" data-status="${statusText}" role="status" aria-live="polite">${statusText}</p>
        ${errorMarkup}
        <button type="button" part="refresh" aria-label="Refresh items" ${refreshDisabled}>Refresh</button>
        <ul part="items" role="listbox" aria-label="Explorer items">${itemsMarkup}</ul>
        ${loadMoreMarkup ? `<div part="load-more-region">${loadMoreMarkup}</div>` : ""}
      </section>
    `;

    this.shadowRoot.querySelector('[part="refresh"]')?.addEventListener("click", () => {
      void this.refresh();
    });
    const searchHeader = this.shadowRoot.querySelector(
      '[part="search-results-header"]',
    ) as BoxSearchResultsHeaderElement | null;
    searchHeader?.addEventListener("action", event => {
      const actionId = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (actionId === "clear-search") {
        void this.clearSearch();
      }
    });
    this.shadowRoot.querySelector('[part="load-more"]')?.addEventListener("click", () => {
      void this.loadNextPage();
    });
    this.shadowRoot.querySelectorAll('[part="breadcrumb"]').forEach(node => {
      node.addEventListener("click", event => {
        const folderId = (event.currentTarget as HTMLElement).getAttribute("data-folder-id");
        if (folderId) {
          void this.navigateTo(folderId);
        }
      });
    });
    this.shadowRoot.querySelectorAll('[part="item"]').forEach(node => {
      node.addEventListener("click", event => {
        if ((event as MouseEvent).detail > 1) {
          return;
        }
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        if (itemId) {
          this.focusItemId = itemId;
          this.toggleSelection(itemId);
          if (shouldActivateOnClick(this.itemGesture)) {
            void this.activateItem(itemId);
          }
        }
      });
      node.addEventListener("dblclick", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        if (itemId) {
          this.focusItemId = itemId;
          void this.activateItem(itemId);
        }
      });
      node.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id") ?? "";
        const itemIds = this.getFocusableItemIds();
        const currentIndex = itemIds.indexOf(itemId);
        let nextIndex = currentIndex;

        if (keyboardEvent.key === "ArrowDown") {
          nextIndex = Math.min(itemIds.length - 1, currentIndex + 1);
        } else if (keyboardEvent.key === "ArrowUp") {
          nextIndex = Math.max(0, currentIndex - 1);
        } else if (keyboardEvent.key === "Home") {
          nextIndex = 0;
        } else if (keyboardEvent.key === "End") {
          nextIndex = itemIds.length - 1;
        } else if (keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          this.focusItemId = itemId;
          this.toggleSelection(itemId);
          if (shouldActivateOnClick(this.itemGesture)) {
            void this.activateItem(itemId);
          }
          return;
        } else if (keyboardEvent.key === "Enter") {
          keyboardEvent.preventDefault();
          this.focusItemId = itemId;
          if (shouldToggleOnEnter(this.itemGesture)) {
            this.toggleSelection(itemId);
          }
          void this.activateItem(itemId);
          return;
        } else {
          return;
        }

        keyboardEvent.preventDefault();
        const nextItemId = itemIds[nextIndex];
        if (nextItemId) {
          this.focusItemId = nextItemId;
          if (this.isRendered) {
            this.update();
          }
        }
      });
    });
    this.shadowRoot.querySelectorAll('[part="item-action"]').forEach(node => {
      node.addEventListener("click", event => {
        event.stopPropagation();
        const currentTarget = event.currentTarget as HTMLElement;
        const itemId = currentTarget.getAttribute("data-item-id");
        const actionId = currentTarget.getAttribute("data-action-id");
        if (itemId && actionId) {
          this.invokeItemAction(itemId, actionId);
        }
      });
    });

    if (this.focusItemId) {
      queueMicrotask(() => {
        const target = Array.from(this.shadowRoot?.querySelectorAll('[part="item"]') ?? []).find(
          node => (node as HTMLButtonElement).dataset.itemId === this.focusItemId,
        ) as HTMLButtonElement | undefined;
        target?.focus();
      });
    }
  
  }
}

export const defineBoxContentExplorerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxContentExplorerElement => {
  defineBoxSearchResultsHeaderElement();
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxContentExplorerElement;
  }

  customElements.define(tagName, BoxContentExplorerElement);
  return BoxContentExplorerElement;
};
