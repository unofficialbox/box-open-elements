import { BaseElement } from "../../core/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-preview-header";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeSelectorValue = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

type PreviewHeaderAction = {
  id: string;
  label: string;
  tone?: string;
};

type PreviewHeaderBreadcrumb = {
  id: string;
  label: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          --_obp-surface: var(--boe-token-surface-surface, #ffffff);
          --_obp-surface-muted: var(--boe-token-surface-surface-secondary, #fbfbfb);
          --_obp-border: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          --_obp-border-subtle: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          --_obp-text-muted: var(--boe-token-text-text-secondary, #6f6f6f);
          --_obp-brand: var(--boe-token-surface-surface-brand, #0061d5);
          --_obp-brand-soft: color-mix(in srgb, var(--_obp-brand) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
        }

        [part="header"] {
          display: grid;
          gap: 0.9rem;
          padding: 1.1rem;
          border: 1px solid var(--_obp-border);
          border-radius: 1rem;
          background: var(--_obp-surface-muted);
        }

        [part="breadcrumbs"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        [part="breadcrumb"] {
          border: none;
          padding: 0;
          background: none;
          color: var(--_obp-text-muted);
          font: inherit;
          cursor: pointer;
        }

        [part="separator"] {
          color: color-mix(in srgb, var(--_obp-text-muted) 62%, transparent);
        }

        [part="main"] {
          display: grid;
          gap: 0.55rem;
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }

        [part="title"] {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="status"] {
          display: inline-flex;
          padding: 0.42rem 0.7rem;
          border-radius: 999px;
          background: var(--_obp-brand-soft);
          color: var(--_obp-brand);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="message"] {
          color: var(--_obp-text-muted);
          line-height: 1.6;
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        [part="action"] {
          border: 1px solid var(--_obp-border-subtle);
          border-radius: 999px;
          padding: 0.75rem 1rem;
          background: var(--_obp-surface);
          color: inherit;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="breadcrumb"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          background: var(--_obp-brand);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          border-color: var(--_obp-brand);
        }
      `;

export class BoxPreviewHeaderElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "breadcrumbs", "message", "status", "heading"];
  }

  private breadcrumbsEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private actionsEl!: HTMLElement;
  private breadcrumbsSignature = "";
  private actionsSignature = "";

  get actions(): PreviewHeaderAction[] {
    return this.parseJsonAttribute<PreviewHeaderAction[]>("actions", []);
  }

  set actions(value: PreviewHeaderAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get breadcrumbs(): PreviewHeaderBreadcrumb[] {
    return this.parseJsonAttribute<PreviewHeaderBreadcrumb[]>("breadcrumbs", []);
  }

  set breadcrumbs(value: PreviewHeaderBreadcrumb[]) {
    this.setAttribute("breadcrumbs", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get status(): string {
    return this.getAttribute("status") ?? "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    super.attributeChangedCallback(name, oldValue, newValue);
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

  private emitAction(actionId: string): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: { action: actionId },
      }),
    );
  }

  private emitBreadcrumbSelected(id: string): void {
    this.dispatchEvent(
      new CustomEvent("breadcrumb-selected", {
        bubbles: true,
        composed: true,
        detail: { id },
      }),
    );
  }

  private breadcrumbsKey(): string {
    return JSON.stringify(this.breadcrumbs.map(crumb => crumb.id));
  }

  private actionsKey(): string {
    return JSON.stringify(this.actions.map(action => action.id));
  }

  private rebuildBreadcrumbs(): void {
    this.breadcrumbsEl.innerHTML = this.breadcrumbs
      .map(
        crumb => `
          <button type="button" part="breadcrumb" data-crumb-id="${escapeHtml(crumb.id)}">
            ${escapeHtml(crumb.label)}
          </button>
        `,
      )
      .join('<span part="separator">/</span>');
  }

  private patchBreadcrumbLabels(): void {
    this.breadcrumbs.forEach(crumb => {
      const button = this.breadcrumbsEl.querySelector(
        `[data-crumb-id="${escapeSelectorValue(crumb.id)}"]`,
      ) as HTMLButtonElement | null;
      if (button) {
        button.textContent = crumb.label;
      }
    });
  }

  private rebuildActions(): void {
    this.actionsEl.innerHTML = this.actions
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
      .join("");
  }

  private patchActionLabels(): void {
    this.actions.forEach(action => {
      const button = this.actionsEl.querySelector(
        `[data-action-id="${escapeSelectorValue(action.id)}"]`,
      ) as HTMLButtonElement | null;
      if (!button) {
        return;
      }
      button.textContent = action.label;
      button.dataset.tone = action.tone ?? "neutral";
    });
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="header">
        <nav part="breadcrumbs" aria-label="Preview breadcrumbs" hidden></nav>
        <div part="main">
          <div part="title-row">
            <div part="title"></div>
            <div part="status" hidden></div>
          </div>
          <div part="message" hidden></div>
        </div>
        <div part="actions" hidden></div>
      </section>
    `;
    this.breadcrumbsEl = this.shadowRoot.querySelector('[part="breadcrumbs"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.statusEl = this.shadowRoot.querySelector('[part="status"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.actionsEl = this.shadowRoot.querySelector('[part="actions"]')!;
  }

  protected setupListeners(): void {
    this.actionsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="action"]') as HTMLButtonElement | null;
      if (!button || !this.actionsEl.contains(button)) {
        return;
      }

      const actionId = button.dataset.actionId ?? "";
      if (actionId) {
        this.emitAction(actionId);
      }
    });

    this.breadcrumbsEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="breadcrumb"]') as HTMLButtonElement | null;
      if (!button || !this.breadcrumbsEl.contains(button)) {
        return;
      }

      const id = button.dataset.crumbId ?? "";
      if (id) {
        this.emitBreadcrumbSelected(id);
      }
    });
  }

  protected update(): void {
    if (!this.titleEl || !this.actionsEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.statusEl.hidden = !this.status;
    this.statusEl.textContent = this.status;
    this.messageEl.hidden = !this.message;
    this.messageEl.textContent = this.message;

    const breadcrumbs = this.breadcrumbs;
    this.breadcrumbsEl.hidden = breadcrumbs.length === 0;
    const nextBreadcrumbs = this.breadcrumbsKey();
    if (nextBreadcrumbs !== this.breadcrumbsSignature || this.breadcrumbsEl.childElementCount === 0) {
      this.breadcrumbsSignature = nextBreadcrumbs;
      this.rebuildBreadcrumbs();
    } else {
      this.patchBreadcrumbLabels();
    }

    const actions = this.actions;
    this.actionsEl.hidden = actions.length === 0;
    const nextActions = this.actionsKey();
    if (nextActions !== this.actionsSignature || this.actionsEl.childElementCount === 0) {
      this.actionsSignature = nextActions;
      this.rebuildActions();
    } else {
      this.patchActionLabels();
    }
  }
}

export const defineBoxPreviewHeaderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPreviewHeaderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPreviewHeaderElement;
  }

  customElements.define(tagName, BoxPreviewHeaderElement);
  return BoxPreviewHeaderElement;
};
