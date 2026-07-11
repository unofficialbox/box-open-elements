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
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="table-shell"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 84%, white 16%);
          border-radius: 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        [part="table-shell"][aria-busy="true"] {
          opacity: 0.72;
        }

        [part="table"] {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
          color: var(--boe-token-text-text, #101820);
        }

        [part="header-row"] {
          background: var(--boe-token-surface-surface-secondary, #f7f9fc);
        }

        [part="header-row"] th {
          padding: 0.6rem 0.8rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
          border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 84%, white 16%);
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
          padding: 0.45rem 0.8rem;
          border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 55%, transparent);
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        [part="row"] {
          transition: background-color 140ms ease;
        }

        [part="row"]:hover {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="row"][aria-selected="true"],
        [part="row"][aria-selected="true"]:hover {
          background: var(--boe-token-surface-item-surface-selected, #e8f1ff);
        }

        [part="selection"] {
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
          width: 1rem;
          height: 1rem;
          margin: 0;
          display: block;
          cursor: pointer;
        }

        [part="selection"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          border-radius: 0.25rem;
        }

        [part="row-item"] {
          appearance: none;
          border: 0;
          margin: 0;
          padding: 0.35rem 0.5rem;
          border-radius: 0.6rem;
          background: transparent;
          color: var(--boe-token-text-text, #101820);
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
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="row-item"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="row-item"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="type-cell"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.85rem;
          text-transform: capitalize;
        }

        [part="empty"] {
          padding: 0.9rem 0.8rem;
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.9rem;
        }

        [part="load-more-region"] {
          display: flex;
          justify-content: center;
          padding: 0.5rem 0.6rem 0.7rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 55%, transparent);
        }

        [part="load-more"] {
          appearance: none;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 0.42rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 86%, white 14%);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #101820);
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="load-more"]:hover {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
        }

        [part="load-more"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      </style>
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
