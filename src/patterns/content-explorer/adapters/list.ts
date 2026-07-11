import { ContentExplorerController } from "../controller.js";

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

export class BoxExplorerListElement extends HTMLElement {
  private controllerValue: ContentExplorerController | null = null;

  private focusItemId: string | null = null;

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

  private getFocusableItemIds(): string[] {
    return this.controllerValue?.getState().items.map(item => item.id) ?? [];
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const state = this.controllerValue?.getState();
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
    const loadMoreMarkup =
      state?.pagination.hasMoreItems && !state.loading
        ? `<button type="button" part="load-more">Load more</button>`
        : "";

    this.shadowRoot.innerHTML = `
      <section part="list-shell" aria-busy="${state?.loading ? "true" : "false"}">
        <ul part="list" role="listbox" aria-label="Items">${itemsMarkup}</ul>
        ${loadMoreMarkup ? `<div part="load-more-region">${loadMoreMarkup}</div>` : ""}
      </section>
    `;

    this.shadowRoot.querySelectorAll('[part~="item"]').forEach(node => {
      node.addEventListener("click", event => {
        const itemId = (event.currentTarget as HTMLElement).getAttribute("data-item-id");
        if (itemId) {
          this.focusItemId = itemId;
          this.controllerValue?.toggleSelection(itemId);
          void this.controllerValue?.activateItem(itemId);
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
        } else if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          (event.currentTarget as HTMLButtonElement).click();
          return;
        } else {
          return;
        }

        keyboardEvent.preventDefault();
        const nextItemId = itemIds[nextIndex];
        if (nextItemId) {
          this.focusItemId = nextItemId;
          this.render();
        }
      });
    });
    this.shadowRoot.querySelectorAll('[part~="item-action"]').forEach(node => {
      node.addEventListener("click", event => {
        event.stopPropagation();
        const currentTarget = event.currentTarget as HTMLElement;
        const itemId = currentTarget.getAttribute("data-item-id");
        const actionId = currentTarget.getAttribute("data-action-id");
        if (itemId && actionId) {
          this.controllerValue?.invokeItemAction(itemId, actionId);
        }
      });
    });
    this.shadowRoot.querySelector('[part="load-more"]')?.addEventListener("click", () => {
      void this.controllerValue?.loadNextPage();
    });

    if (this.focusItemId) {
      queueMicrotask(() => {
        const target = Array.from(this.shadowRoot?.querySelectorAll('[part~="item"]') ?? []).find(
          node => (node as HTMLButtonElement).dataset.itemId === this.focusItemId,
        ) as HTMLButtonElement | undefined;
        target?.focus();
      });
    }
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
