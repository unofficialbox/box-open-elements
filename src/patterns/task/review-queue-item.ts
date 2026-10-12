import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/interaction.js";

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

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="item"] {
          display: grid;
          gap: 0.6rem;
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
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
          gap: ${boePanel.gap};
          align-items: center;
        }

        [part="assignee-avatar"] {
          width: 2rem;
          height: 2rem;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
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
          gap: ${boePanel.gap};
        }

        [part="metric"] {
          display: grid;
          gap: 0.12rem;
          padding: 0.45rem 0.6rem;
          border-radius: ${boePanel.radius};
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
          gap: ${boePanel.gap};
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

export class ReviewQueueItem extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
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
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style>
      <div part="content-host"><article part="item"><button type="button" part="select"></button>
      <div part="body"><div part="assignee" hidden></div><div part="metrics" hidden></div><div part="actions" hidden></div></div></article></div>`;
  }

  protected setupListeners(): void {
    this.shadowRoot!.querySelector('[part="select"]')!.addEventListener("click", () => this.emitSelected());
    const actions = this.shadowRoot!.querySelector('[part="actions"]')!;
    actions.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (button?.dataset.actionId && actions.contains(button)) { event.stopPropagation(); this.emitAction(button.dataset.actionId); }
    });
  }

  protected update(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    const select = root.querySelector('[part="select"]')!;
    select.setAttribute("aria-label", `Open ${this.heading} review item`);
    select.innerHTML = `<header part="header"><div part="title-row"><div part="title">${escapeHtml(this.heading)}</div>${this.status ? `<span part="status">${escapeHtml(this.status)}</span>` : ""}${this.priority ? `<span part="priority">${escapeHtml(this.priority)}</span>` : ""}</div>${this.itemLabel ? `<div part="item-label">${escapeHtml(this.itemLabel)}</div>` : ""}${this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : ""}<div part="meta">${this.dueDate ? `<span part="due-date">Due ${escapeHtml(this.dueDate)}</span>` : ""}</div></header>`;
    const assignee = root.querySelector<HTMLElement>('[part="assignee"]')!; const person = this.assignee; assignee.hidden = !person;
    assignee.innerHTML = person ? `<span part="assignee-avatar">${escapeHtml(person.initials ?? person.name.slice(0, 2).toUpperCase())}</span><span part="assignee-meta"><span part="assignee-name">${escapeHtml(person.name)}</span>${person.role ? `<span part="assignee-role">${escapeHtml(person.role)}</span>` : ""}</span>` : "";
    const metrics = root.querySelector<HTMLElement>('[part="metrics"]')!; metrics.hidden = !this.metrics.length;
    metrics.innerHTML = this.metrics.map(metric => `<div part="metric"><span part="metric-label">${escapeHtml(metric.label)}</span><span part="metric-value">${escapeHtml(metric.value)}</span></div>`).join("");
    const actions = root.querySelector<HTMLElement>('[part="actions"]')!; actions.hidden = !this.actions.length;
    syncKeyedChildren(actions, this.actions, action => action.id, () => actionButton("action"), (button, action) => { button.dataset.actionId = action.id; button.dataset.tone = action.tone ?? "neutral"; button.textContent = action.label; });
  }
}

ReviewQueueItem.register();
