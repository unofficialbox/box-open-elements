import { ContentExplorerController } from "../controller.js";

const DEFAULT_TAG_NAME = "box-explorer-breadcrumbs";

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxExplorerBreadcrumbsElement extends HTMLElement {
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

    for (const eventName of ["breadcrumbsChanged", "folderLoaded", "folderChanged"] as const) {
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

    const breadcrumbs = this.controllerValue?.getState().breadcrumbs ?? [];
    const markup = breadcrumbs.length
      ? breadcrumbs
          .map(
            crumb =>
              `<button type="button" part="breadcrumb" data-folder-id="${escapeHtml(crumb.id)}">${escapeHtml(crumb.name)}</button>`,
          )
          .join('<span part="separator">/</span>')
      : `<span part="empty">No breadcrumbs</span>`;

    this.shadowRoot.innerHTML = `<nav part="breadcrumbs">${markup}</nav>`;

    this.shadowRoot.querySelectorAll('[part="breadcrumb"]').forEach(node => {
      node.addEventListener("click", event => {
        const folderId = (event.currentTarget as HTMLElement).getAttribute("data-folder-id");
        if (folderId) {
          void this.controllerValue?.navigateTo(folderId);
        }
      });
    });
  }
}

export const defineBoxExplorerBreadcrumbsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerBreadcrumbsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerBreadcrumbsElement;
  }

  customElements.define(tagName, BoxExplorerBreadcrumbsElement);
  return BoxExplorerBreadcrumbsElement;
};
