import { BaseElement } from "../../core/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-review-queue-item";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ReviewQueueItemAction = {
  id: string;
  label: string;
  tone?: string;
};

type ReviewQueueItemAssignee = {
  initials?: string;
  name: string;
  role?: string;
};

type ReviewQueueItemMetric = {
  label: string;
  value: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="item"] {
          display: grid;
          gap: 0.6rem;
          padding: 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.7rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: grid;
          gap: 0.35rem;
        }

        [part="title-row"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="item-label"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-weight: 600;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="status"],
        [part="priority"],
        [part="due-date"] {
          display: inline-flex;
          align-items: center;
          padding: 0.28rem 0.55rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        [part="priority"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 62%, var(--boe-token-text-text, #222222));
        }

        [part="due-date"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 12%, var(--boe-token-surface-surface, #ffffff));
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-accent, #5b4b8a) 72%, var(--boe-token-text-text, #222222));
        }

        [part="body"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem 0.65rem;
          align-items: center;
          justify-content: space-between;
        }

        [part="assignee"] {
          display: inline-grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.55rem;
          align-items: center;
        }

        [part="assignee-avatar"] {
          width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(180deg, #2b7de9 0%, #0057c2 100%);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        [part="assignee-meta"] {
          display: grid;
          gap: 0.1rem;
        }

        [part="assignee-name"] {
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="assignee-role"],
        [part="metric-label"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="metrics"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        [part="metric"] {
          display: grid;
          gap: 0.12rem;
          padding: 0.45rem 0.6rem;
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="metric-value"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        [part="select"] {
          width: 100%;
          appearance: none;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          padding: 0;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="action"]')}
        ${boeNeutralInteractiveStyles('[part="select"]')}
        ${boeBrandInteractiveStyles('[part="action"][data-tone="primary"]')}

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }
      `;

export class BoxReviewQueueItemElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "assignee", "due-date", "heading", "item-label", "message", "metrics", "priority", "status"];
  }
  get actions(): ReviewQueueItemAction[] {
    return this.parseJsonAttribute<ReviewQueueItemAction[]>("actions", []);
  }

  set actions(value: ReviewQueueItemAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get assignee(): ReviewQueueItemAssignee | null {
    return this.parseJsonAttribute<ReviewQueueItemAssignee | null>("assignee", null);
  }

  set assignee(value: ReviewQueueItemAssignee | null) {
    if (!value) {
      this.removeAttribute("assignee");
      return;
    }

    this.setAttribute("assignee", JSON.stringify(value));
  }

  get dueDate(): string {
    return this.getAttribute("due-date") ?? "";
  }

  set dueDate(value: string) {
    if (!value) {
      this.removeAttribute("due-date");
      return;
    }

    this.setAttribute("due-date", value);
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

  get metrics(): ReviewQueueItemMetric[] {
    return this.parseJsonAttribute<ReviewQueueItemMetric[]>("metrics", []);
  }

  set metrics(value: ReviewQueueItemMetric[]) {
    this.setAttribute("metrics", JSON.stringify(value));
  }

  get priority(): string {
    return this.getAttribute("priority") ?? "";
  }

  set priority(value: string) {
    if (!value) {
      this.removeAttribute("priority");
      return;
    }

    this.setAttribute("priority", value);
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
    return this.getAttribute("heading") ?? "Review Queue Item";
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
        detail: { action: actionId, title: this.heading, itemLabel: this.itemLabel },
      }),
    );
  }

  private emitSelected(): void {
    this.dispatchEvent(
      new CustomEvent("selected", {
        bubbles: true,
        composed: true,
        detail: { title: this.heading, itemLabel: this.itemLabel },
      }),
    );
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

    const assignee = this.assignee;
    const itemMarkup = this.itemLabel ? `<div part="item-label">${escapeHtml(this.itemLabel)}</div>` : "";
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const statusMarkup = this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : "";
    const priorityMarkup = this.priority ? `<span part="priority">${escapeHtml(this.priority)}</span>` : "";
    const dueDateMarkup = this.dueDate ? `<span part="due-date">Due ${escapeHtml(this.dueDate)}</span>` : "";
    const assigneeMarkup = assignee
      ? `
          <div part="assignee">
            <span part="assignee-avatar">${escapeHtml(assignee.initials ?? assignee.name.slice(0, 2).toUpperCase())}</span>
            <span part="assignee-meta">
              <span part="assignee-name">${escapeHtml(assignee.name)}</span>
              ${assignee.role ? `<span part="assignee-role">${escapeHtml(assignee.role)}</span>` : ""}
            </span>
          </div>
        `
      : "";
    const metricsMarkup = this.metrics.length
      ? `
          <div part="metrics">
            ${this.metrics
              .map(
                metric => `
                  <div part="metric">
                    <span part="metric-label">${escapeHtml(metric.label)}</span>
                    <span part="metric-value">${escapeHtml(metric.value)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        `
      : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button type="button" part="action" data-action-id="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone ?? "neutral")}">
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
      <article part="item">
        <button type="button" part="select" aria-label="Open ${escapeHtml(this.heading)} review item">
          <header part="header">
            <div part="title-row">
              <div part="title">${escapeHtml(this.heading)}</div>
              ${statusMarkup}
              ${priorityMarkup}
            </div>
            ${itemMarkup}
            ${messageMarkup}
            <div part="meta">${dueDateMarkup}</div>
          </header>
        </button>
        <div part="body">
          ${assigneeMarkup}
          ${metricsMarkup}
          ${actionsMarkup}
        </div>
      </article>
    `;

    this.shadowRoot.querySelector('[part="select"]')?.addEventListener("click", () => {
      this.emitSelected();
    });

    this.shadowRoot.querySelectorAll<HTMLButtonElement>('[part="action"]').forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const actionId = button.dataset.actionId;
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });
  
  }
}

export const defineBoxReviewQueueItemElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxReviewQueueItemElement);
  }
};
