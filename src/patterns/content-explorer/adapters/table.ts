import { ContentExplorerController } from "../controller.js";
import {
  resolveExplorerItemGesture,
  shouldActivateOnClick,
  shouldToggleOnEnter,
} from "../types.js";
import { BoxExplorerActionMenuElement } from "./action-menu.js";
import {
  formatItemDate,
  formatItemOwner,
  formatItemShared,
  formatItemSize,
  itemSummarySignature,
} from "./item-summary.js";
import { BaseElement } from "../../../core/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-explorer-table";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          /* The table's header row is nowrap, so its min-content width is wide.
             Without this the host refuses to shrink below that width and pushes
             out of grid/flex containers instead of scrolling. */
          min-width: 0;
        }

        [part="table-shell"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          /* Scroll the table within its own frame when the host is narrower
             than the table's intrinsic width. */
          overflow-x: auto;
          overflow-y: hidden;
        }

        [part="table-shell"][aria-busy="true"] {
          opacity: 0.72;
        }

        [part="table"] {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
          color: var(--boe-token-text-text, #222222);
        }

        [part="header-row"] {
          background: var(--boe-token-surface-surface-secondary, #fbfbfb);
        }

        [part="header-row"] th {
          padding: 0.5rem 0.65rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          white-space: nowrap;
        }

        [part="header-selection"] {
          width: 2.5rem;
        }

        [part="header-actions"],
        [part="actions-cell"] {
          text-align: right;
        }

        [part="row"] td {
          padding: 0.4rem 0.65rem;
          border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 55%, transparent);
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        [part="row"] {
          transition: background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="row"][aria-selected="true"],
        [part="row"][aria-selected="true"]:hover {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part="selection"] {
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
          width: 1rem;
          height: 1rem;
          margin: 0;
          display: block;
          cursor: pointer;
          border-radius: ${boeRadius.size};
        }

        ${boeFocusVisibleStyles('[part="selection"]')}

        [part="row-item"] {
          appearance: none;
          border: 0;
          margin: 0;
          padding: 0.35rem 0.5rem;
          border-radius: ${boeRadius.med};
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.94rem;
          font-weight: 500;
          text-align: left;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row-item"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="row-item"]:active:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
        }

        ${boeFocusVisibleStyles('[part="row-item"]')}

        [part="row-item"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: none;
        }

        [part="type-cell"],
        [part="modified-cell"],
        [part="size-cell"],
        [part="owner-cell"],
        [part="shared-cell"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.85rem;
          white-space: nowrap;
        }

        [part="type-cell"] {
          text-transform: capitalize;
        }

        [part="size-cell"] {
          font-variant-numeric: tabular-nums;
        }

        [part="empty"] {
          padding: 0.6rem 0.65rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.9rem;
        }

        [part="load-more-region"] {
          display: flex;
          justify-content: center;
          padding: 0.5rem 0.6rem 0.7rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 55%, transparent);
        }

        [part="load-more"] {
          appearance: none;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 0.35rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition:
            border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        ${boeNeutralInteractiveStyles('[part="load-more"]')}
      `;

export class BoxExplorerTableElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["item-gesture"];
  }

  private controllerValue: ContentExplorerController | null = null;

  private unsubscribeFns: Array<() => void> = [];

  get itemGesture(): ReturnType<typeof resolveExplorerItemGesture> {
    return resolveExplorerItemGesture(this.getAttribute("item-gesture"));
  }

  set itemGesture(value: ReturnType<typeof resolveExplorerItemGesture>) {
    this.setAttribute("item-gesture", value);
  }

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
      "itemsChanged",
      "itemActivated",
      "itemActionInvoked",
      "loadingChanged",
      "paginationChanged",
      "selectionChanged",
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

  private itemsSignature = "";

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="table-shell">
        <table part="table">
          <caption part="caption" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
            Content items
          </caption>
          <thead>
            <tr part="header-row">
              <th part="header-selection" scope="col">Select</th>
              <th part="header-name" scope="col">Name</th>
              <th part="header-type" scope="col">Type</th>
              <th part="header-modified" scope="col">Modified</th>
              <th part="header-size" scope="col">Size</th>
              <th part="header-owner" scope="col">Owner</th>
              <th part="header-shared" scope="col">Shared</th>
              <th part="header-actions" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div part="load-more-region" hidden></div>
      </section>
    `;
  }

  protected setupListeners(): void {
    const tbody = this.shadowRoot?.querySelector("tbody");
    const loadMoreRegion = this.shadowRoot?.querySelector('[part="load-more-region"]');
    if (!tbody || !loadMoreRegion) {
      return;
    }

    tbody.addEventListener("click", event => {
      const rowItem = (event.target as HTMLElement).closest('[part="row-item"]') as HTMLElement | null;
      if (!rowItem || !tbody.contains(rowItem)) {
        return;
      }
      if ((event as MouseEvent).detail > 1) {
        return;
      }
      const itemId = rowItem.getAttribute("data-item-id");
      if (itemId) {
        this.controllerValue?.toggleSelection(itemId);
        if (shouldActivateOnClick(this.itemGesture)) {
          void this.controllerValue?.activateItem(itemId);
        }
      }
    });

    tbody.addEventListener("dblclick", event => {
      const rowItem = (event.target as HTMLElement).closest('[part="row-item"]') as HTMLElement | null;
      if (!rowItem || !tbody.contains(rowItem)) {
        return;
      }
      const itemId = rowItem.getAttribute("data-item-id");
      if (itemId) {
        void this.controllerValue?.activateItem(itemId);
      }
    });

    tbody.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const rowItem = (keyboardEvent.target as HTMLElement).closest('[part="row-item"]') as HTMLElement | null;
      if (!rowItem || !tbody.contains(rowItem)) {
        return;
      }
      const itemId = rowItem.getAttribute("data-item-id");
      if (!itemId) {
        return;
      }

      if (keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.controllerValue?.toggleSelection(itemId);
        if (shouldActivateOnClick(this.itemGesture)) {
          void this.controllerValue?.activateItem(itemId);
        }
        return;
      }

      if (keyboardEvent.key === "Enter") {
        keyboardEvent.preventDefault();
        if (shouldToggleOnEnter(this.itemGesture)) {
          this.controllerValue?.toggleSelection(itemId);
        }
        void this.controllerValue?.activateItem(itemId);
      }
    });

    tbody.addEventListener("change", event => {
      const checkbox = (event.target as HTMLElement).closest('[part="selection"]') as HTMLInputElement | null;
      if (!checkbox || !tbody.contains(checkbox)) {
        return;
      }
      const itemId = checkbox.getAttribute("data-item-id");
      if (itemId) {
        this.controllerValue?.toggleSelection(itemId);
      }
    });

    loadMoreRegion.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="load-more"]')) {
        void this.controllerValue?.loadNextPage();
      }
    });
  }

  private syncActionMenus(): void {
    this.shadowRoot?.querySelectorAll("box-explorer-action-menu").forEach(node => {
      const itemId = node.getAttribute("data-item-id");
      const menuElement = node as BoxExplorerActionMenuElement;
      menuElement.controller = this.controllerValue;
      menuElement.itemId = itemId;
    });
  }

  private patchSelection(): void {
    const state = this.controllerValue?.getState();
    const tbody = this.shadowRoot?.querySelector("tbody");
    if (!state || !tbody) {
      return;
    }

    tbody.querySelectorAll('[part="row"]').forEach(row => {
      const itemId = (row as HTMLElement).dataset.itemId ?? "";
      const isSelected = state.selectedItemIds.includes(itemId);
      row.setAttribute("aria-selected", isSelected ? "true" : "false");
      const checkbox = row.querySelector('[part="selection"]') as HTMLInputElement | null;
      if (checkbox && checkbox !== this.shadowRoot?.activeElement) {
        checkbox.checked = isSelected;
      }
    });
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controllerValue?.getState();
    const shell = this.shadowRoot.querySelector('[part="table-shell"]') as HTMLElement | null;
    const tbody = this.shadowRoot.querySelector("tbody") as HTMLElement | null;
    const loadMoreRegion = this.shadowRoot.querySelector('[part="load-more-region"]') as HTMLElement | null;
    if (!shell || !tbody || !loadMoreRegion) {
      return;
    }

    shell.setAttribute("aria-busy", state?.loading ? "true" : "false");

    const nextSignature = JSON.stringify({
      items:
        state?.items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          ...itemSummarySignature(item),
        })) ?? [],
      actions: state?.availableActionsByItemId ?? {},
      hasMore: state?.pagination.hasMoreItems ?? false,
      loading: state?.loading ?? false,
    });

    if (nextSignature !== this.itemsSignature) {
      this.itemsSignature = nextSignature;
      const rowsMarkup = state?.items.length
        ? state.items
            .map(item => {
              const isSelected = state.selectedItemIds.includes(item.id);
              const actions = (state.availableActionsByItemId[item.id] ?? []).length
                ? `<box-explorer-action-menu part="row-action-menu" data-item-id="${escapeHtml(item.id)}"></box-explorer-action-menu>`
                : "";
              const sizeLabel = item.type === "file" ? formatItemSize(item.size) : "";
              const modifiedLabel = formatItemDate(item.modifiedAt);
              const ownerLabel = formatItemOwner(item);
              const sharedLabel = formatItemShared(item.sharedLink);

              return `
                <tr part="row" data-item-id="${escapeHtml(item.id)}" aria-selected="${isSelected ? "true" : "false"}">
                  <td part="selection-cell">
                    <input
                      type="checkbox"
                      part="selection"
                      data-item-id="${escapeHtml(item.id)}"
                      aria-label="${escapeHtml(`Select ${item.name}`)}"
                      ${isSelected ? "checked" : ""}
                    />
                  </td>
                  <td part="name-cell">
                    <button
                      type="button"
                      part="row-item"
                      data-item-id="${escapeHtml(item.id)}"
                      aria-label="${escapeHtml(item.name)}"
                    >${escapeHtml(item.name)}</button>
                  </td>
                  <td part="type-cell">${escapeHtml(item.type)}</td>
                  <td part="modified-cell">${escapeHtml(modifiedLabel)}</td>
                  <td part="size-cell">${escapeHtml(sizeLabel)}</td>
                  <td part="owner-cell">${escapeHtml(ownerLabel)}</td>
                  <td part="shared-cell">${escapeHtml(sharedLabel)}</td>
                  <td part="actions-cell">${actions}</td>
                </tr>
              `;
            })
            .join("")
        : `<tr part="empty-row"><td colspan="8" part="empty">No items loaded</td></tr>`;

      tbody.innerHTML = rowsMarkup;

      if (state?.pagination.hasMoreItems && !state.loading) {
        loadMoreRegion.hidden = false;
        loadMoreRegion.innerHTML = `<button type="button" part="load-more">Load more</button>`;
      } else {
        loadMoreRegion.hidden = true;
        loadMoreRegion.innerHTML = "";
      }

      this.syncActionMenus();
      return;
    }

    // Preserve checkbox nodes across selection-only updates.
    this.patchSelection();
  }
}

export const defineBoxExplorerTableElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerTableElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerTableElement;
  }

  customElements.define(tagName, BoxExplorerTableElement);
  return BoxExplorerTableElement;
};
