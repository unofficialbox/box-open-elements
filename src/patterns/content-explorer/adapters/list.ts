import { ContentExplorerController } from "../controller.js";
import { BaseElement } from "../../../core/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-explorer-list";

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
        }

        [part="list-shell"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          border-radius: 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        [part="list-shell"][aria-busy="true"] {
          opacity: 0.72;
        }

        [part="list"] {
          list-style: none;
          margin: 0;
          padding: 0.4rem;
          display: grid;
          gap: 0.15rem;
        }

        [part~="item-row"] {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.15rem 0.35rem;
          border-radius: 0.7rem;
          transition: background-color 140ms ease;
        }

        [part~="item-row"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part~="item-row-selected"],
        [part~="item-row-selected"]:hover {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part~="item"] {
          flex: 1;
          min-width: 0;
          appearance: none;
          text-align: left;
          border: 0;
          margin: 0;
          padding: 0.55rem 0.6rem;
          border-radius: 0.6rem;
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.94rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part~="item"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part~="item"]:active:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
        }

        ${boeFocusVisibleStyles('[part~="item"]')}

        [part~="item"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: none;
        }

        [part~="item-selected"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item-actions"] {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex: none;
        }

        [part~="item-action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: 0.6rem;
          margin: 0;
          padding: 0.3rem 0.6rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        ${boeNeutralInteractiveStyles('[part~="item-action"]')}

        input[type="checkbox"] {
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        ${boeFocusVisibleStyles('input[type="checkbox"]')}

        [part="empty"] {
          padding: 0.9rem 0.8rem;
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
          padding: 0.42rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            box-shadow 140ms ease;
        }

        ${boeNeutralInteractiveStyles('[part="load-more"]')}
      `;

export class BoxExplorerListElement extends BaseElement {
  private controllerValue: ContentExplorerController | null = null;

  private focusItemId: string | null = null;

  private unsubscribeFns: Array<() => void> = [];
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

  private getFocusableItemIds(): string[] {
    return this.controllerValue?.getState().items.map(item => item.id) ?? [];
  }

  private itemsSignature = "";

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="list-shell">
        <ul part="list" role="listbox" aria-label="Items"></ul>
        <div part="load-more-region" hidden></div>
      </section>
    `;
  }

  protected setupListeners(): void {
    const list = this.shadowRoot?.querySelector('[part="list"]');
    const loadMoreRegion = this.shadowRoot?.querySelector('[part="load-more-region"]');
    if (!list || !loadMoreRegion) {
      return;
    }

    list.addEventListener("click", event => {
      const target = event.target as HTMLElement;
      const actionButton = target.closest('[part~="item-action"]') as HTMLElement | null;
      if (actionButton && list.contains(actionButton)) {
        event.stopPropagation();
        const itemId = actionButton.getAttribute("data-item-id");
        const actionId = actionButton.getAttribute("data-action-id");
        if (itemId && actionId) {
          this.controllerValue?.invokeItemAction(itemId, actionId);
        }
        return;
      }

      const itemButton = target.closest('[part~="item"]') as HTMLElement | null;
      if (itemButton && list.contains(itemButton)) {
        const itemId = itemButton.getAttribute("data-item-id");
        if (itemId) {
          this.focusItemId = itemId;
          this.controllerValue?.toggleSelection(itemId);
          void this.controllerValue?.activateItem(itemId);
        }
      }
    });

    list.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const itemButton = (keyboardEvent.target as HTMLElement).closest('[part~="item"]') as HTMLElement | null;
      if (!itemButton || !list.contains(itemButton)) {
        return;
      }

      const itemId = itemButton.getAttribute("data-item-id") ?? "";
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
      } else if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        itemButton.click();
        return;
      } else {
        return;
      }

      keyboardEvent.preventDefault();
      const nextItemId = itemIds[nextIndex];
      if (nextItemId) {
        this.focusItemId = nextItemId;
        this.patchFocusAndSelection();
        queueMicrotask(() => {
          const target = list.querySelector(`[part~="item"][data-item-id="${nextItemId}"]`) as HTMLButtonElement | null;
          target?.focus();
        });
      }
    });

    loadMoreRegion.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="load-more"]')) {
        void this.controllerValue?.loadNextPage();
      }
    });
  }

  private patchFocusAndSelection(): void {
    const state = this.controllerValue?.getState();
    const list = this.shadowRoot?.querySelector('[part="list"]');
    if (!state || !list) {
      return;
    }

    const focusTarget = this.focusItemId ?? state.items[0]?.id ?? "";
    list.querySelectorAll('[part~="item-row"]').forEach(row => {
      const itemId = (row as HTMLElement).dataset.itemId ?? "";
      const isSelected = state.selectedItemIds.includes(itemId);
      row.setAttribute("part", isSelected ? "item-row item-row-selected" : "item-row");
      const button = row.querySelector('[part~="item"]') as HTMLButtonElement | null;
      if (button) {
        button.setAttribute("part", isSelected ? "item item-selected" : "item");
        button.setAttribute("aria-selected", isSelected ? "true" : "false");
        button.tabIndex = itemId === focusTarget ? 0 : -1;
      }
    });
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controllerValue?.getState();
    const shell = this.shadowRoot.querySelector('[part="list-shell"]') as HTMLElement | null;
    const list = this.shadowRoot.querySelector('[part="list"]') as HTMLElement | null;
    const loadMoreRegion = this.shadowRoot.querySelector('[part="load-more-region"]') as HTMLElement | null;
    if (!shell || !list || !loadMoreRegion) {
      return;
    }

    shell.setAttribute("aria-busy", state?.loading ? "true" : "false");

    const nextSignature = JSON.stringify({
      items: state?.items.map(item => ({ id: item.id, name: item.name })) ?? [],
      actions: state?.availableActionsByItemId ?? {},
      hasMore: state?.pagination.hasMoreItems ?? false,
      loading: state?.loading ?? false,
    });

    if (nextSignature !== this.itemsSignature) {
      this.itemsSignature = nextSignature;
      const itemsMarkup =
        state?.items.length
          ? state.items
              .map(item => {
                const isSelected = state.selectedItemIds.includes(item.id);
                const focusTarget = this.focusItemId ?? state.items[0]?.id ?? "";
                const actions = (state.availableActionsByItemId[item.id] ?? [])
                  .map(
                    action =>
                      `<button
                        type="button"
                        part="item-action"
                        data-item-id="${escapeHtml(item.id)}"
                        data-action-id="${escapeHtml(action.id)}"
                        aria-label="${escapeHtml(`${action.label} ${item.name}`)}"
                      >${escapeHtml(action.label)}</button>`,
                  )
                  .join("");

                return `
                  <li part="item-row${isSelected ? " item-row-selected" : ""}" data-item-id="${escapeHtml(item.id)}" role="presentation">
                    <button
                      type="button"
                      part="item${isSelected ? " item-selected" : ""}"
                      role="option"
                      data-item-id="${escapeHtml(item.id)}"
                      aria-selected="${isSelected ? "true" : "false"}"
                      tabindex="${item.id === focusTarget ? "0" : "-1"}"
                    >${escapeHtml(item.name)}</button>
                    ${actions ? `<div part="item-actions">${actions}</div>` : ""}
                  </li>
                `;
              })
              .join("")
          : `<li part="empty">No items loaded</li>`;

      list.innerHTML = itemsMarkup;

      if (state?.pagination.hasMoreItems && !state.loading) {
        loadMoreRegion.hidden = false;
        loadMoreRegion.innerHTML = `<button type="button" part="load-more">Load more</button>`;
      } else {
        loadMoreRegion.hidden = true;
        loadMoreRegion.innerHTML = "";
      }

      if (this.focusItemId) {
        queueMicrotask(() => {
          const target = list.querySelector(
            `[part~="item"][data-item-id="${this.focusItemId}"]`,
          ) as HTMLButtonElement | null;
          target?.focus();
        });
      }
      return;
    }

    // Item list unchanged: patch selection/focus in place so keyboard focus survives.
    this.patchFocusAndSelection();
  }
}

export const defineBoxExplorerListElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerListElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerListElement;
  }

  customElements.define(tagName, BoxExplorerListElement);
  return BoxExplorerListElement;
};
