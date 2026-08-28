import {
  resolvePreviewStatus,
  type PreviewAdapterState,
  type PreviewCommand,
  type PreviewProvider,
  type PreviewProviderActionDetail,
  type PreviewProviderAdapter,
  type PreviewStatus,
} from "./provider-adapter.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-preview-element";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export type PreviewElementAction = {
  id: string;
  label: string;
  tone?: string;
};

/** Detail for the `command` event mirrored alongside adapter.sendCommand. */
export type PreviewElementCommandDetail = {
  command: PreviewCommand;
  providerId: string | null;
};

const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          --_obp-error: var(--boe-token-surface-status-surface-error, #ed3757);
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="shell"] {
          display: grid;
          gap: 0.6rem;
          padding: ${boePanel.padding};
          border: 1px solid var(--_obp-border);
          border-radius: ${boePanel.radius};
          background: var(--_obp-surface-muted);
        }

        [part="topline"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          justify-content: space-between;
        }

        [part="topline-meta"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="provider"],
        [part="status"] {
          display: inline-flex;
          padding: 0.18rem 0.48rem;
          border-radius: 999px;
          background: var(--_obp-brand-soft);
          color: var(--_obp-text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        [part="status"][data-status="error"] {
          background: color-mix(in srgb, var(--_obp-error) 14%, var(--_obp-surface) 86%);
          color: var(--_obp-error);
        }

        [part="error"] {
          margin: 0;
          padding: 0.5rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--_obp-error) 50%, #fff);
          border-radius: 8px;
          background: color-mix(in srgb, var(--_obp-error) 10%, #fff);
          color: inherit;
        }

        [part="adapter-meta"],
        [part="capabilities"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        [part="adapter-chip"],
        [part="capability"] {
          display: inline-flex;
          padding: 0.18rem 0.48rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--_obp-surface) 80%, transparent);
          border: 1px solid var(--_obp-border-subtle);
          color: var(--_obp-text-muted);
          font-size: 0.75rem;
        }

        [part="header"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: inherit;
        }

        [part="item-label"] {
          color: var(--_obp-text-muted);
          font-weight: 700;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.55;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="action"],
        [part="control"] {
          appearance: none;
          min-height: 2rem;
          padding: 0.4rem 0.7rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--_obp-brand);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="control"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        [part="controls"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="control-readout"] {
          color: var(--_obp-text-muted);
          font-size: 0.85rem;
          font-variant-numeric: tabular-nums;
        }

        [part="toolbar"] {
          display: block;
        }

        [part="workspace"] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
          gap: 0.6rem;
          align-items: start;
        }

        [part="workspace"][data-sidebar="empty"] {
          grid-template-columns: minmax(0, 1fr);
        }

        [part="stage"] {
          min-block-size: 13rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: ${boePanel.radius};
          background: var(--_obp-surface);
          overflow: hidden;
        }

        [part="stage"][aria-busy="true"] {
          opacity: 0.7;
        }

        [part="stage-mount"] {
          width: 100%;
          height: 100%;
        }

        [part="stage-mount"][hidden] {
          display: none;
        }

        [part="sidebar"] {
          display: grid;
          gap: 0.6rem;
        }

        [part="workspace"][data-sidebar="empty"] [part="sidebar"] {
          display: none;
        }

        ::slotted([slot="toolbar"]) {
          display: block;
        }

        ::slotted([slot="stage"]) {
          display: block;
          width: 100%;
          height: 100%;
        }

        ::slotted([slot="sidebar"]) {
          display: block;
        }

        @media (max-width: 860px) {
          [part="workspace"] {
            grid-template-columns: 1fr;
          }
        }
      `;

export class Preview extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  private providerAdapterValue: PreviewProviderAdapter | null = null;

  private providerAdapterUnsubscribe: (() => void) | null = null;

  private adapterMounted = false;

  static get observedAttributes(): string[] {
    return ["actions", "adapter-state", "item-label", "message", "provider", "provider-label", "status", "heading"];
  }

  get actions(): PreviewElementAction[] {
    return this.parseJsonAttribute<PreviewElementAction[]>("actions", []);
  }

  set actions(value: PreviewElementAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get adapterState(): PreviewAdapterState | null {
    return this.parseJsonAttribute<PreviewAdapterState | null>("adapter-state", null);
  }

  set adapterState(value: PreviewAdapterState | null) {
    if (!value) {
      this.removeAttribute("adapter-state");
      return;
    }

    this.setAttribute("adapter-state", JSON.stringify(value));
  }

  get itemLabel(): string {
    return this.getAttribute("item-label") ?? "";
  }

  set itemLabel(value: string) {
    if (!value) {
      this.removeAttribute("item-label");
      return;
    }

    this.setAttribute("item-label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    if (!value) {
      this.removeAttribute("message");
      return;
    }

    this.setAttribute("message", value);
  }

  get provider(): PreviewProvider | null {
    return this.parseJsonAttribute<PreviewProvider | null>("provider", null);
  }

  set provider(value: PreviewProvider | null) {
    if (!value) {
      this.removeAttribute("provider");
      return;
    }

    this.setAttribute("provider", JSON.stringify(value));
  }

  get providerLabel(): string {
    return this.getAttribute("provider-label") ?? "";
  }

  set providerLabel(value: string) {
    if (!value) {
      this.removeAttribute("provider-label");
      return;
    }

    this.setAttribute("provider-label", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    if (!value) {
      this.removeAttribute("status");
      return;
    }

    this.setAttribute("status", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Preview Element";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get providerAdapter(): PreviewProviderAdapter | null {
    return this.providerAdapterValue;
  }

  set providerAdapter(value: PreviewProviderAdapter | null) {
    this.teardownProviderAdapter();
    this.providerAdapterValue = value;
    if (this.isConnected) {
      this.attachProviderAdapter();
    }
    if (this.isRendered) {
      this.update();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Re-attach after a detach: disconnectedCallback tears the subscription and
    // mount down, so a reconnect must restore both or the element goes stale.
    this.attachProviderAdapter();
    if (this.isRendered) {
      this.update();
    }
  }

  disconnectedCallback(): void {
    this.teardownProviderAdapter();
  }

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private attachProviderAdapter(): void {
    const adapter = this.providerAdapterValue;
    if (!adapter) {
      return;
    }

    if (adapter.subscribe && !this.providerAdapterUnsubscribe) {
      this.providerAdapterUnsubscribe = adapter.subscribe(() => {
        if (this.isRendered) {
          this.update();
        }
      });
    }

    const mountNode = this.shadowRoot?.querySelector('[part="stage-mount"]') as HTMLElement | null;
    if (adapter.mount && mountNode && !this.adapterMounted) {
      mountNode.hidden = false;
      adapter.mount(mountNode);
      this.adapterMounted = true;
    }
  }

  private teardownProviderAdapter(): void {
    this.providerAdapterUnsubscribe?.();
    this.providerAdapterUnsubscribe = null;
    if (this.adapterMounted) {
      this.providerAdapterValue?.unmount?.();
      this.adapterMounted = false;
      const mountNode = this.shadowRoot?.querySelector('[part="stage-mount"]') as HTMLElement | null;
      if (mountNode) {
        mountNode.hidden = true;
      }
    }
  }

  private getActiveProvider(): PreviewProvider | null {
    return this.providerAdapterValue?.getProvider() ?? this.provider;
  }

  private getActiveAdapterState(): PreviewAdapterState | null {
    return this.providerAdapterValue?.getState() ?? this.adapterState;
  }

  private emitAction(actionId: string): void {
    const provider = this.getActiveProvider();
    const adapterState = this.getActiveAdapterState();
    const detail: PreviewProviderActionDetail = {
      action: actionId,
      adapterState,
      provider,
      providerId: provider?.id ?? null,
    };

    Promise.resolve(this.providerAdapterValue?.performAction?.(detail)).catch((error: unknown) => {
      this.dispatchEvent(
        new CustomEvent("action-error", {
          bubbles: true,
          composed: true,
          detail: {
            action: actionId,
            message: error instanceof Error ? error.message : "Preview action failed",
          },
        }),
      );
    });

    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  private emitCommand(command: PreviewCommand): void {
    const provider = this.getActiveProvider();
    const detail: PreviewElementCommandDetail = {
      command,
      providerId: provider?.id ?? null,
    };

    Promise.resolve(this.providerAdapterValue?.sendCommand?.(command)).catch((error: unknown) => {
      this.dispatchEvent(
        new CustomEvent("action-error", {
          bubbles: true,
          composed: true,
          detail: {
            action: command.command,
            message: error instanceof Error ? error.message : "Preview command failed",
          },
        }),
      );
    });

    this.dispatchEvent(
      new CustomEvent("command", {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Stable skeleton: the chrome host is re-rendered per update, while the
    // workspace (adapter mount node + slots) keeps node identity so mounted
    // preview engines and slotted content survive chrome updates.
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <article part="shell">
        <div part="content-host"></div>
        <div part="toolbar">
          <slot name="toolbar"></slot>
        </div>
        <div part="workspace" data-sidebar="empty">
          <div part="stage">
            <div part="stage-mount" hidden></div>
            <slot name="stage"></slot>
          </div>
          <aside part="sidebar">
            <slot name="sidebar"></slot>
          </aside>
        </div>
      </article>
    `;
  }

  protected setupListeners(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Delegated once — chrome re-renders never re-bind listeners.
    this.shadowRoot.querySelector('[part="content-host"]')?.addEventListener("click", event => {
      const target = (event.target as HTMLElement).closest("[data-action-id], [data-command]") as HTMLElement | null;
      if (!target || (target as HTMLButtonElement).disabled) {
        return;
      }
      const actionId = target.getAttribute("data-action-id");
      if (actionId) {
        this.emitAction(actionId);
        return;
      }
      const command = target.getAttribute("data-command");
      if (command) {
        this.emitCommand({ command } as PreviewCommand);
      }
    });

    const sidebarSlot = this.shadowRoot.querySelector('slot[name="sidebar"]') as HTMLSlotElement | null;
    const workspace = this.shadowRoot.querySelector('[part="workspace"]') as HTMLElement | null;
    const syncSidebar = () => {
      const hasContent = (sidebarSlot?.assignedNodes({ flatten: true }) ?? []).some(
        node => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim() !== "",
      );
      workspace?.setAttribute("data-sidebar", hasContent ? "filled" : "empty");
    };
    sidebarSlot?.addEventListener("slotchange", syncSidebar);
    syncSidebar();

    this.attachProviderAdapter();
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const provider = this.getActiveProvider();
    const adapterState = this.getActiveAdapterState();
    const providerLabel = provider?.label ?? this.providerLabel;
    const lifecycle: PreviewStatus = resolvePreviewStatus(adapterState);
    const statusLabel = provider?.status ?? this.status ?? "";
    const statusText = statusLabel || (adapterState ? lifecycle : "");
    const statusMarkup = statusText
      ? `<span part="status" role="status" data-status="${escapeHtml(lifecycle)}">${escapeHtml(statusText)}</span>`
      : "";
    const errorMarkup =
      lifecycle === "error"
        ? `<p part="error" role="alert">${escapeHtml(adapterState?.errorMessage ?? "Preview failed to load.")}</p>`
        : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const providerMarkup = providerLabel ? `<span part="provider">${escapeHtml(providerLabel)}</span>` : "";
    const itemMarkup = this.itemLabel ? `<div part="item-label">${escapeHtml(this.itemLabel)}</div>` : "";
    const adapterMarkup = adapterState
      ? `
          <div part="adapter-meta" aria-label="Preview adapter state">
            ${adapterState.mode ? `<span part="adapter-chip">${escapeHtml(adapterState.mode)}</span>` : ""}
            ${adapterState.pageLabel ? `<span part="adapter-chip">${escapeHtml(adapterState.pageLabel)}</span>` : ""}
            ${adapterState.zoomLabel ? `<span part="adapter-chip">${escapeHtml(adapterState.zoomLabel)}</span>` : ""}
            ${adapterState.selectionLabel ? `<span part="adapter-chip">${escapeHtml(adapterState.selectionLabel)}</span>` : ""}
            ${
              adapterState.currentAnnotationId
                ? `<span part="adapter-chip">${escapeHtml(`Annotation ${adapterState.currentAnnotationId}`)}</span>`
                : ""
            }
          </div>
        `
      : "";
    const capabilityMarkup = provider?.capabilities?.length
      ? `
          <div part="capabilities" aria-label="Preview provider capabilities">
            ${provider.capabilities.map(capability => `<span part="capability">${escapeHtml(capability)}</span>`).join("")}
          </div>
        `
      : "";
    const controlsMarkup = this.renderControls(adapterState);
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button
                    type="button"
                    part="action"
                    data-action-id="${escapeHtml(action.id)}"
                    data-tone="${escapeHtml(action.tone ?? "neutral")}"
                  >
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : "";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <div part="topline">
        <div part="topline-meta">
          ${providerMarkup}
          ${statusMarkup}
        </div>
        ${actionsMarkup}
      </div>
      <header part="header">
        <h2 part="title">${escapeHtml(this.heading)}</h2>
        ${itemMarkup}
        ${messageMarkup}
        ${errorMarkup}
        ${adapterMarkup}
        ${capabilityMarkup}
        ${controlsMarkup}
      </header>
    `;

    const stage = this.shadowRoot.querySelector('[part="stage"]');
    stage?.setAttribute("aria-busy", lifecycle === "loading" ? "true" : "false");
  }

  /**
   * Paging/zoom controls render only when the adapter accepts commands and the
   * state carries the numeric fields to drive them.
   */
  private renderControls(adapterState: PreviewAdapterState | null): string {
    if (!this.providerAdapterValue?.sendCommand || !adapterState) {
      return "";
    }

    const segments: string[] = [];
    if (typeof adapterState.page === "number" && typeof adapterState.pageCount === "number") {
      const atFirst = adapterState.page <= 1;
      const atLast = adapterState.page >= adapterState.pageCount;
      segments.push(`
        <button type="button" part="control" data-command="previous-page" aria-label="Previous page" ${atFirst ? "disabled" : ""}>&#8249;</button>
        <span part="control-readout">Page ${adapterState.page} of ${adapterState.pageCount}</span>
        <button type="button" part="control" data-command="next-page" aria-label="Next page" ${atLast ? "disabled" : ""}>&#8250;</button>
      `);
    }
    if (typeof adapterState.zoomPercent === "number") {
      segments.push(`
        <button type="button" part="control" data-command="zoom-out" aria-label="Zoom out">&#8722;</button>
        <span part="control-readout">${Math.round(adapterState.zoomPercent)}%</span>
        <button type="button" part="control" data-command="zoom-in" aria-label="Zoom in">&#43;</button>
      `);
    }

    return segments.length ? `<div part="controls" aria-label="Preview controls">${segments.join("")}</div>` : "";
  }
}

Preview.register();
