import { ContentExplorerController } from "../controller.js";
import { BoxExplorerActionMenuElement } from "./action-menu.js";

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

export class BoxExplorerTableElement extends HTMLElement {
  private controllerValue: ContentExplorerController | null = null;

  private unsubscribeFns: Array<() => void> = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get controller(): ContentExplorerController | null {
    return this.controllerValue;
  }

  set controller(value: ContentExplorerController | null) {
    this.controllerValue = value;
    this.bindController();
    this.render();
  }

  connectedCallback(): void {
    this.bindController();
    this.render();
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
          this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controllerValue?.getState();
    const rowsMarkup = state?.items.length
      ? state.items
          .map(item => {
            const isSelected = state.selectedItemIds.includes(item.id);
            const actions = (state.availableActionsByItemId[item.id] ?? []).length
              ? `<box-explorer-action-menu part="row-action-menu" data-item-id="${escapeHtml(item.id)}"></box-explorer-action-menu>`
              : "";

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
                    aria-label="${escapeHtml(`Open ${item.name}`)}"
                  >${escapeHtml(item.name)}</button>
                </td>
                <td part="type-cell">${escapeHtml(item.type)}</td>
                <td part="actions-cell">${actions}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr part="empty-row"><td colspan="4" part="empty">No items loaded</td></tr>`;
    const loadMoreMarkup =
      state?.pagination.hasMoreItems && !state.loading
        ? `<button type="button" part="load-more">Load more</button>`
        : "";

    this.shadowRoot.innerHTML = `
      <section part="table-shell" aria-busy="${state?.loading ? "true" : "false"}">
        <table part="table">
          <caption part="caption" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
            Content items
          </caption>
          <thead>
            <tr part="header-row">
              <th part="header-selection" scope="col">Select</th>
              <th part="header-name" scope="col">Name</th>
              <th part="header-type" scope="col">Type</th>
              <th part="header-actions" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>${rowsMarkup}</tbody>
        </table>
        ${loadMoreMarkup ? `<div part="load-more-region">${loadMoreMarkup}</div>` : ""}
      </section>
    `;

    this.shadowRoot.querySelectorAll('[part="row-item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        if (itemId) {
          this.controllerValue?.toggleSelection(itemId);
          void this.controllerValue?.activateItem(itemId);
        }
      });
    });
    this.shadowRoot.querySelectorAll('[part="selection"]').forEach(node => {
      node.addEventListener("change", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        if (itemId) {
          this.controllerValue?.toggleSelection(itemId);
        }
      });
    });
    this.shadowRoot.querySelectorAll("box-explorer-action-menu").forEach(node => {
      const itemId = node.getAttribute("data-item-id");
      const menuElement = node as BoxExplorerActionMenuElement;
      menuElement.controller = this.controllerValue;
      menuElement.itemId = itemId;
    });
    this.shadowRoot.querySelector('[part="load-more"]')?.addEventListener("click", () => {
      void this.controllerValue?.loadNextPage();
    });
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
