import { ContentExplorerController } from "../controller.js";

const DEFAULT_TAG_NAME = "box-explorer-action-menu";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxExplorerActionMenuElement extends HTMLElement {
  private controllerValue: ContentExplorerController | null = null;

  private itemIdValue: string | null = null;

  private open = false;

  private unsubscribeFns: Array<() => void> = [];

  private menuId = `box-action-menu-${Math.random().toString(36).slice(2, 10)}`;

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

  get itemId(): string | null {
    return this.itemIdValue;
  }

  set itemId(value: string | null) {
    this.itemIdValue = value;
    this.open = false;
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

    this.unsubscribeFns.push(
      this.controllerValue.subscribe("itemsChanged", payload => {
        this.dispatchEvent(
          new CustomEvent("items-changed", {
            bubbles: true,
            composed: true,
            detail: payload,
          }),
        );
        this.render();
      }),
    );

    this.unsubscribeFns.push(
      this.controllerValue.subscribe("selectionChanged", () => {
        this.render();
      }),
    );

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

    const actions = this.itemIdValue ? (this.controllerValue?.getItemActions(this.itemIdValue) ?? []) : [];

    if (!this.itemIdValue || actions.length === 0) {
      this.shadowRoot.innerHTML = `<span part="empty"></span>`;
      return;
    }

    const menuMarkup = this.open
      ? `<div id="${this.menuId}" part="menu" role="menu">${actions
          .map(
            action =>
              `<button type="button" part="menu-item" role="menuitem" data-action-id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`,
          )
          .join("")}</div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-grid;
          position: relative;
          color: inherit;
          font: inherit;
        }

        [part="menu-shell"] {
          position: relative;
          display: inline-grid;
          justify-items: end;
        }

        [part="trigger"] {
          width: 2rem;
          min-width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
          border-radius: 0.75rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, #eef4fb 6%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          cursor: pointer;
          padding: 0;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="trigger"]:hover {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, var(--boe-token-stroke-stroke, #e8e8e8) 72%);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="trigger"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
          outline-offset: 2px;
        }

        [part="trigger"][aria-expanded="true"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          box-shadow: 0 10px 22px rgba(0, 97, 213, 0.18);
        }

        [part="trigger-label"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        [part="trigger-icon"] {
          font-size: 1rem;
          line-height: 1;
          transform: translateY(-1px);
        }

        [part="menu"] {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 3;
          min-width: 11rem;
          margin: 0;
          padding: 0.45rem;
          display: grid;
          gap: 0.2rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
          border-radius: 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 18px 32px rgba(0, 67, 146, 0.12);
        }

        [part="menu-item"] {
          width: 100%;
          appearance: none;
          text-align: left;
          border: 0;
          border-radius: 0.7rem;
          background: transparent;
          color: var(--boe-token-text-text, #222222);
          font: inherit;
          font-size: 0.92rem;
          padding: 0.6rem 0.7rem;
          cursor: pointer;
        }

        [part="menu-item"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 64%, var(--boe-token-surface-surface, #ffffff) 36%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="menu-item"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 76%, var(--boe-token-surface-surface, #ffffff) 24%);
          outline-offset: 1px;
        }
      </style>
      <div part="menu-shell">
        <button
          type="button"
          part="trigger"
          aria-label="Open item actions"
          aria-expanded="${this.open ? "true" : "false"}"
          aria-haspopup="menu"
          ${this.open ? `aria-controls="${this.menuId}"` : ""}
        ><span part="trigger-label">Actions</span><span part="trigger-icon" aria-hidden="true">⋯</span></button>
        ${menuMarkup}
      </div>
    `;

    const trigger = this.shadowRoot.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.addEventListener("click", () => {
      this.open = !this.open;
      this.render();
    });
    trigger?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.open = true;
        this.render();
      } else if (keyboardEvent.key === "Escape" && this.open) {
        keyboardEvent.preventDefault();
        this.open = false;
        this.render();
      }
    });
    this.shadowRoot.querySelectorAll('[part="menu-item"]').forEach(node => {
      node.addEventListener("click", event => {
        const actionId = (event.currentTarget as HTMLElement).getAttribute("data-action-id");
        if (this.itemIdValue && actionId) {
          const item = this.controllerValue?.getState().items.find(entry => entry.id === this.itemIdValue) ?? null;
          const action = this.controllerValue?.getItemActions(this.itemIdValue).find(entry => entry.id === actionId) ?? null;
          this.controllerValue?.invokeItemAction(this.itemIdValue, actionId);
          if (item && action) {
            this.dispatchEvent(
              new CustomEvent(toKebabCase("itemActionInvoked"), {
                bubbles: true,
                composed: true,
                detail: { action, item },
              }),
            );
          }
          this.open = false;
          this.render();
        }
      });
      node.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          this.open = false;
          this.render();
          queueMicrotask(() => {
            (this.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null)?.focus();
          });
        }
      });
    });

    if (this.open) {
      queueMicrotask(() => {
        (this.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null)?.focus();
      });
    }
  }
}

export const defineBoxExplorerActionMenuElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerActionMenuElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerActionMenuElement;
  }

  customElements.define(tagName, BoxExplorerActionMenuElement);
  return BoxExplorerActionMenuElement;
};
