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
