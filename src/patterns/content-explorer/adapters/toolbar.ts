import { ContentExplorerController } from "../controller.js";

const DEFAULT_TAG_NAME = "box-explorer-toolbar";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

export class BoxExplorerToolbarElement extends HTMLElement {
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

    for (const eventName of ["loadingChanged", "selectionChanged", "loadFailed"] as const) {
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
    const loading = state?.loading ?? false;
    const selectedCount = state?.selectedItemIds.length ?? 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="toolbar"] {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 84%, white 16%);
          border-radius: 0.9rem;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        [part="status"],
        [part="selection-count"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.85rem;
          white-space: nowrap;
        }

        [part="selection-count"] {
          margin-right: auto;
        }

        [part="refresh"],
        [part="clear-selection"] {
          appearance: none;
          font: inherit;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 0.42rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 86%, white 14%);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #101820);
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="refresh"]:hover:not(:disabled),
        [part="clear-selection"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
        }

        [part="refresh"]:focus-visible,
        [part="clear-selection"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="refresh"]:disabled,
        [part="clear-selection"]:disabled {
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #52606d) 60%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 70%, white 30%);
          cursor: not-allowed;
        }
      </style>
      <div part="toolbar">
        <span part="status">${loading ? "loading" : "ready"}</span>
        <span part="selection-count">${selectedCount} selected</span>
        <button type="button" part="refresh" ${loading ? "disabled" : ""}>Refresh</button>
        <button type="button" part="clear-selection" ${selectedCount === 0 ? "disabled" : ""}>Clear Selection</button>
      </div>
    `;

    this.shadowRoot.querySelector('[part="refresh"]')?.addEventListener("click", () => {
      void this.controllerValue?.refresh();
    });
    this.shadowRoot.querySelector('[part="clear-selection"]')?.addEventListener("click", () => {
      this.controllerValue?.clearSelection();
    });
  }
}

export const defineBoxExplorerToolbarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerToolbarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerToolbarElement;
  }

  customElements.define(tagName, BoxExplorerToolbarElement);
  return BoxExplorerToolbarElement;
};
