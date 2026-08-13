import { ContentPickerController } from "./controller.js";
import type { PickerEvents, PickerItemType, PickerSessionConfig, PickerState } from "./types.js";
import type {
  ExplorerItem,
  ExplorerState,
  ExplorerTransport,
} from "../content-explorer/types.js";
import { formatItemMetaLine } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-content-picker";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const readPositiveNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const readTokenList = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean)
    : [];

const PICKER_ITEM_TYPES = new Set<PickerItemType>(["file", "folder", "web_link"]);


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
          border-radius: ${boeRadius.med};
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

        [part="error"] {
          margin: 0;
          padding: 0.55rem 0.7rem;
          border-radius: ${boeRadius.large};
          font-size: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff));
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 34%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
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
          border-radius: ${boeRadius.med};
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition: color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="item"]:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        [part="item-name"],
        [part="item-meta"] {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="item-meta"] {
          font-size: 0.78rem;
          font-weight: 400;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="item"]:hover:not(:disabled) {
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

        [part="load-more-region"] {
          display: flex;
          justify-content: center;
        }

        [part="load-more"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="load-more"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="footer"] {
          display: flex;
          align-items: center;
          gap: ${boePanel.gap};
          padding-top: 0.2rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 62%, transparent);
        }

        [part="selection-count"] {
          flex: 1;
          font-size: 0.85rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="cancel"],
        [part="choose"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          min-height: 2.1rem;
          padding: 0.4rem 0.9rem;
          border-radius: ${boeRadius.control};
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="cancel"] {
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
        }

        [part="cancel"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="choose"] {
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="choose"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
        }

        [part="choose"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="cancel"]:focus-visible,
        [part="choose"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

export class ContentPicker extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      "cancel-label",
      "choose-label",
      "extensions",
      "language",
      "max-selectable",
      "page-size",
      "root-folder-id",
      "selectable-types",
      "token",
    ];
  }

  private controller: ContentPickerController | null = null;

  private pendingStart = false;

  private focusItemId: string | null = null;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: ExplorerTransport | null = null;

  get language(): string | null {
    return this.getAttribute("language");
  }

  set language(value: string | null) {
    this.updateStringAttribute("language", value);
  }

  get pageSize(): number | undefined {
    return readPositiveNumber(this.getAttribute("page-size"));
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

  get maxSelectable(): number | undefined {
    return readPositiveNumber(this.getAttribute("max-selectable"));
  }

  set maxSelectable(value: number | undefined) {
    if (typeof value === "number" && value > 0) {
      this.setAttribute("max-selectable", String(value));
      return;
    }

    this.removeAttribute("max-selectable");
  }

  /** Comma-separated in markup, e.g. `extensions="pdf,docx"`. */
  get extensions(): string[] {
    return readTokenList(this.getAttribute("extensions"));
  }

  set extensions(value: string[]) {
    if (value.length) {
      this.setAttribute("extensions", value.join(","));
      return;
    }

    this.removeAttribute("extensions");
  }

  /** Comma-separated in markup, e.g. `selectable-types="file,web_link"`. */
  get selectableTypes(): PickerItemType[] {
    return readTokenList(this.getAttribute("selectable-types")).filter((entry): entry is PickerItemType =>
      PICKER_ITEM_TYPES.has(entry as PickerItemType),
    );
  }

  set selectableTypes(value: PickerItemType[]) {
    if (value.length) {
      this.setAttribute("selectable-types", value.join(","));
      return;
    }

    this.removeAttribute("selectable-types");
  }

  get chooseLabel(): string {
    return this.getAttribute("choose-label") ?? "Choose";
  }

  set chooseLabel(value: string) {
    this.setAttribute("choose-label", value);
  }

  get cancelLabel(): string {
    return this.getAttribute("cancel-label") ?? "Cancel";
  }

  set cancelLabel(value: string) {
    this.setAttribute("cancel-label", value);
  }

  get transport(): ExplorerTransport | null {
    return this.transportValue;
  }

  set transport(value: ExplorerTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  get state(): Readonly<PickerState> | null {
    return this.controller?.getState() ?? null;
  }

  get explorerState(): Readonly<ExplorerState> | null {
    return this.controller?.explorer.getState() ?? null;
  }

  /** The live session controller. Null until configured and connected. */
  get pickerController(): ContentPickerController | null {
    return this.controller;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Labels are presentation-only; everything else re-creates the session.
    if (name !== "choose-label" && name !== "cancel-label") {
      this.scheduleStart();
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

  async navigateTo(folderId: string): Promise<void> {
    await this.controller?.explorer.navigateTo(folderId);
  }

  async search(query: string): Promise<void> {
    await this.controller?.explorer.search(query);
  }

  async clearSearch(): Promise<void> {
    await this.controller?.explorer.clearSearch();
  }

  async loadNextPage(): Promise<void> {
    await this.controller?.explorer.loadNextPage();
  }

  togglePick(itemId: string): void {
    this.controller?.togglePick(itemId);
  }

  clearPicks(): void {
    this.controller?.clearPicks();
  }

  choose(): ExplorerItem[] | null {
    return this.controller?.choose() ?? null;
  }

  cancel(): void {
    this.controller?.cancel();
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

    this.teardownController();
    const controller = new ContentPickerController(config);
    this.controller = controller;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
    await controller.connect();
  }

  private readConfig(): PickerSessionConfig | null {
    if (!this.transportValue || !this.rootFolderId || !this.token) {
      return null;
    }

    return {
      extensions: this.extensions.length ? this.extensions : undefined,
      language: this.language ?? undefined,
      maxSelectable: this.maxSelectable,
      pageSize: this.pageSize,
      rootFolderId: this.rootFolderId,
      selectableTypes: this.selectableTypes.length ? this.selectableTypes : undefined,
      token: this.token,
      transport: this.transportValue,
    };
  }

  private subscribeToController(controller: ContentPickerController): void {
    const rerender = () => {
      if (this.isRendered) {
        this.update();
      }
    };

    const pickerEvents: Array<[keyof PickerEvents, string]> = [
      ["cancelled", "cancelled"],
      ["chosen", "chosen"],
      ["selectionChanged", "selection-changed"],
      ["selectionRejected", "selection-rejected"],
    ];

    this.unsubscribeFns = [
      ...pickerEvents.map(([eventName, domEventName]) =>
        controller.subscribe(eventName, payload => {
          this.dispatchEvent(
            new CustomEvent(domEventName, {
              bubbles: true,
              composed: true,
              detail: payload,
            }),
          );
          rerender();
        }),
      ),
      controller.explorer.subscribe("itemActivated", ({ item }) => {
        this.dispatchEvent(
          new CustomEvent("item-activated", {
            bubbles: true,
            composed: true,
            detail: { item },
          }),
        );
      }),
      controller.explorer.subscribe("loadingChanged", rerender),
      controller.explorer.subscribe("loadSucceeded", rerender),
      controller.explorer.subscribe("searchSucceeded", rerender),
      controller.explorer.subscribe("loadFailed", rerender),
      controller.explorer.subscribe("selectionChanged", rerender),
      controller.explorer.subscribe("breadcrumbsChanged", rerender),
      controller.explorer.subscribe("paginationChanged", rerender),
    ];
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
    return this.controller?.explorer.getState().items.map(item => item.id) ?? [];
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

    const controller = this.controller;
    const explorerState = controller?.explorer.getState();
    const pickerState = controller?.getState();

    const breadcrumbMarkup = explorerState?.breadcrumbs.length
      ? `<nav part="breadcrumbs" aria-label="Breadcrumbs">${explorerState.breadcrumbs
          .map(
            crumb =>
              `<button type="button" part="breadcrumb" data-folder-id="${escapeHtml(crumb.id)}" aria-label="Open ${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button>`,
          )
          .join('<span part="breadcrumb-separator">/</span>')}</nav>`
      : "";
    const folderMarkup = explorerState?.currentFolder
      ? `<header part="folder">${breadcrumbMarkup}<h2>${escapeHtml(explorerState.currentFolder.name)}</h2></header>`
      : `<header part="folder"><h2>No folder loaded</h2></header>`;

    const itemsMarkup = explorerState?.items.length
      ? explorerState.items
          .map(item => {
            const pickable = controller?.isItemPickable(item) ?? false;
            const picked = controller?.isPicked(item.id) ?? false;
            const navigable = item.type === "folder";
            const interactive = pickable || navigable;
            const focusTarget = this.focusItemId ?? explorerState.items[0]?.id ?? "";
            const meta = formatItemMetaLine(item);

            return `<li data-item-id="${escapeHtml(item.id)}" role="presentation">
                <button
                  type="button"
                  part="item"
                  role="option"
                  data-item-id="${escapeHtml(item.id)}"
                  data-item-type="${escapeHtml(item.type)}"
                  data-pickable="${pickable ? "true" : "false"}"
                  aria-selected="${picked ? "true" : "false"}"
                  aria-label="${escapeHtml(item.name)}"
                  tabindex="${item.id === focusTarget ? "0" : "-1"}"
                  ${interactive ? "" : 'disabled aria-disabled="true"'}
                ><span part="item-name">${escapeHtml(item.name)}</span>${
                  meta ? `<span part="item-meta">${escapeHtml(meta)}</span>` : ""
                }</button>
              </li>`;
          })
          .join("")
      : `<li role="presentation">No items loaded</li>`;

    const loadMoreMarkup =
      explorerState?.pagination.hasMoreItems && !explorerState.loading
        ? `<div part="load-more-region"><button type="button" part="load-more">Load more</button></div>`
        : "";
    const errorMarkup = explorerState?.error
      ? `<p part="error">${escapeHtml(explorerState.error.message)}</p>`
      : "";

    const selectedCount = pickerState?.selectedItems.length ?? 0;
    const max = pickerState?.maxSelectable ?? null;
    const countText = max === null ? `${selectedCount} selected` : `${selectedCount} of ${max} selected`;
    const footerMarkup = `
      <footer part="footer">
        <span part="selection-count" aria-live="polite">${escapeHtml(countText)}</span>
        <button type="button" part="cancel">${escapeHtml(this.cancelLabel)}</button>
        <button type="button" part="choose" ${pickerState?.canChoose ? "" : "disabled"}>${escapeHtml(this.chooseLabel)}</button>
      </footer>
    `;

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    // Sample focus BEFORE the rebuild wipes the focused node.
    const hadFocusInside = this.isFocusInsideHost();

    host.innerHTML = `
      <section aria-busy="${explorerState?.loading ? "true" : "false"}">
        ${folderMarkup}
        ${errorMarkup}
        <ul part="items" role="listbox" aria-label="Picker items" aria-multiselectable="${max === 1 ? "false" : "true"}">${itemsMarkup}</ul>
        ${loadMoreMarkup}
        ${footerMarkup}
      </section>
    `;

    this.shadowRoot.querySelectorAll('[part="breadcrumb"]').forEach(node => {
      node.addEventListener("click", event => {
        const folderId = (event.currentTarget as HTMLElement).getAttribute("data-folder-id");
        if (folderId) {
          void this.navigateTo(folderId);
        }
      });
    });
    this.shadowRoot.querySelector('[part="load-more"]')?.addEventListener("click", () => {
      void this.loadNextPage();
    });
    this.shadowRoot.querySelector('[part="cancel"]')?.addEventListener("click", () => {
      this.cancel();
    });
    this.shadowRoot.querySelector('[part="choose"]')?.addEventListener("click", () => {
      this.choose();
    });
    this.shadowRoot.querySelectorAll('[part="item"]').forEach(node => {
      node.addEventListener("click", event => {
        if ((event as MouseEvent).detail > 1) {
          return;
        }
        const target = event.currentTarget as HTMLElement;
        const itemId = target.getAttribute("data-item-id");
        if (!itemId) {
          return;
        }
        this.focusItemId = itemId;
        // Un-pickable folders navigate on click; everything pickable toggles.
        if (target.getAttribute("data-pickable") === "true") {
          this.togglePick(itemId);
        } else if (target.getAttribute("data-item-type") === "folder") {
          void this.controller?.explorer.activateItem(itemId);
        }
      });
      node.addEventListener("dblclick", event => {
        const target = event.currentTarget as HTMLElement;
        const itemId = target.getAttribute("data-item-id");
        if (itemId && target.getAttribute("data-item-type") === "folder") {
          this.focusItemId = itemId;
          void this.controller?.explorer.activateItem(itemId);
        }
      });
      node.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const target = event.currentTarget as HTMLElement;
        const itemId = target.getAttribute("data-item-id") ?? "";
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
          if (target.getAttribute("data-pickable") === "true") {
            this.togglePick(itemId);
          }
          return;
        } else if (keyboardEvent.key === "Enter") {
          keyboardEvent.preventDefault();
          this.focusItemId = itemId;
          if (target.getAttribute("data-item-type") === "folder") {
            void this.controller?.explorer.activateItem(itemId);
          } else if (target.getAttribute("data-pickable") === "true") {
            this.togglePick(itemId);
          }
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

    // Restore focus only when it already lived inside this element before the
    // rebuild — an unrelated state update must never steal focus.
    if (this.focusItemId && hadFocusInside) {
      queueMicrotask(() => {
        const target = Array.from(this.shadowRoot?.querySelectorAll('[part="item"]') ?? []).find(
          node => (node as HTMLButtonElement).dataset.itemId === this.focusItemId,
        ) as HTMLButtonElement | undefined;
        target?.focus();
      });
    }
  }

  private isFocusInsideHost(): boolean {
    const active = document.activeElement;
    if (!active) {
      return false;
    }

    return active === this || (this.shadowRoot?.contains(active) ?? false);
  }
}

ContentPicker.register();
