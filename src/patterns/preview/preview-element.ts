import type {
  PreviewAdapterState,
  PreviewProvider,
  PreviewProviderActionDetail,
  PreviewProviderAdapter,
} from "./provider-adapter.js";

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

export class BoxPreviewElement extends HTMLElement {
  private providerAdapterValue: PreviewProviderAdapter | null = null;

  private providerAdapterUnsubscribe: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return ["actions", "adapter-state", "item-label", "message", "provider", "provider-label", "status", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

  get title(): string {
    return this.getAttribute("title") ?? "Preview Element";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get providerAdapter(): PreviewProviderAdapter | null {
    return this.providerAdapterValue;
  }

  set providerAdapter(value: PreviewProviderAdapter | null) {
    this.teardownProviderAdapter();
    this.providerAdapterValue = value;
    if (value?.subscribe) {
      this.providerAdapterUnsubscribe = value.subscribe(() => {
        this.render();
      });
    }
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.teardownProviderAdapter();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private teardownProviderAdapter(): void {
    this.providerAdapterUnsubscribe?.();
    this.providerAdapterUnsubscribe = null;
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

    void this.providerAdapterValue?.performAction?.(detail);

    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
    this.dispatchEvent(
      new CustomEvent("provider-action", {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const provider = this.getActiveProvider();
    const adapterState = this.getActiveAdapterState();
    const providerLabel = provider?.label ?? this.providerLabel;
    const providerStatus = provider?.status ?? this.status;
    const statusMarkup = providerStatus ? `<span part="status">${escapeHtml(providerStatus)}</span>` : "";
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
            ${
              typeof adapterState.ready === "boolean"
                ? `<span part="adapter-chip">${adapterState.ready ? "Ready" : "Connecting"}</span>`
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

    this.shadowRoot.innerHTML = `
      <style>
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
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, white 88%);
        }

        [part="shell"] {
          display: grid;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
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
          font-size: 1.35rem;
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

        [part="action"] {
          appearance: none;
          min-height: 2rem;
          padding: 0.35rem 0.72rem;
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
          color: #fff;
        }

        [part="toolbar"] {
          display: block;
        }

        [part="workspace"] {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
          gap: 1rem;
          align-items: start;
        }

        [part="stage"] {
          min-block-size: 19rem;
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 1rem;
          background:
            radial-gradient(circle at top left, color-mix(in srgb, var(--_obp-brand) 10%, transparent), transparent 32%),
            linear-gradient(180deg, color-mix(in srgb, var(--_obp-surface) 86%, white 14%) 0%, var(--_obp-surface-muted) 100%);
          overflow: hidden;
        }

        [part="sidebar"] {
          display: grid;
          gap: 1rem;
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
      </style>
      <article part="shell">
        <div part="topline">
          <div part="topline-meta">
            ${providerMarkup}
            ${statusMarkup}
          </div>
          ${actionsMarkup}
        </div>
        <header part="header">
          <div part="title">${escapeHtml(this.title)}</div>
          ${itemMarkup}
          ${messageMarkup}
          ${adapterMarkup}
          ${capabilityMarkup}
        </header>
        <div part="toolbar">
          <slot name="toolbar"></slot>
        </div>
        <div part="workspace">
          <div part="stage">
            <slot name="stage"></slot>
          </div>
          <aside part="sidebar">
            <slot name="sidebar"></slot>
          </aside>
        </div>
      </article>
    `;

    this.shadowRoot.querySelectorAll('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.getAttribute("data-action-id");
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });
  }
}

export const defineBoxPreviewElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPreviewElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPreviewElement;
  }

  customElements.define(tagName, BoxPreviewElement);
  return BoxPreviewElement;
};
