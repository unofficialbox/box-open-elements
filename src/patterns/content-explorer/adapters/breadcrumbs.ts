import { ContentExplorerController } from "../controller.js";
import { BaseElement } from "../../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../../foundations/motion/index.js";

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


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
        }

        [part="breadcrumbs"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.15rem;
          min-width: 0;
        }

        [part="breadcrumb"] {
          appearance: none;
          border: 0;
          margin: 0;
          padding: 0.3rem 0.55rem;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font: inherit;
          font-size: 0.92rem;
          font-weight: 500;
          line-height: 1.2;
          cursor: pointer;
          max-width: 16rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition:
            background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="breadcrumb"]:hover {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="breadcrumb"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="breadcrumb"]:last-of-type {
          color: var(--boe-token-text-text, #222222);
          font-weight: 600;
        }

        [part="separator"] {
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 55%, transparent);
          font-size: 0.85rem;
          user-select: none;
        }

        [part="empty"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.9rem;
        }
      `;

export class BoxExplorerBreadcrumbsElement extends BaseElement {
  private controllerValue: ContentExplorerController | null = null;

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

    const breadcrumbs = this.controllerValue?.getState().breadcrumbs ?? [];
    const markup = breadcrumbs.length
      ? breadcrumbs
          .map(
            crumb =>
              `<button type="button" part="breadcrumb" data-folder-id="${escapeHtml(crumb.id)}">${escapeHtml(crumb.name)}</button>`,
          )
          .join('<span part="separator">/</span>')
      : `<span part="empty">No breadcrumbs</span>`;

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <nav part="breadcrumbs">${markup}</nav>`;

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
