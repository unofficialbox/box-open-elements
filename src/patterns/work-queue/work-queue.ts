import { WorkQueueController } from "./controller.js";
import {
  DUE_BUCKET_LABELS,
  DUE_BUCKET_ORDER,
  resolveDueBucket,
} from "./types.js";
import type {
  DueBucket,
  WorkItem,
  WorkQueueEvents,
  WorkQueueFilters,
  WorkQueueTransport,
} from "./types.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-work-queue";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        section[part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
          transition: opacity ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        section[part="panel"][aria-busy="true"] {
          opacity: 0.65;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="error"] {
          margin: 0;
          padding: 0.55rem 0.7rem;
          border-radius: ${boeRadius.large};
          font-size: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, var(--boe-token-surface-surface, #ffffff));
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 34%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 72%, black 28%);
        }

        [part="bucket"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="bucket-title"] {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="bucket"][data-bucket="overdue"] [part="bucket-title"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="items"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.45rem;
        }

        [part="row"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.55rem 0.6rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boeRadius.large};
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, transparent);
        }

        [part="row"][data-bucket="overdue"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 40%, transparent);
        }

        [part="row-header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="row-title"] {
          appearance: none;
          border: none;
          background: transparent;
          padding: 0;
          font: inherit;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
          text-align: left;
          cursor: pointer;
        }

        [part="row-title"]:hover {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="row-title"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          border-radius: ${boeRadius.med};
        }

        [part="entity"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.82rem;
        }

        [part="type"],
        [part="risk"],
        [part="priority"],
        [part="assignee"] {
          display: inline-flex;
          padding: 0.16rem 0.45rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.75rem;
          font-weight: 600;
        }

        [part="risk"][data-risk="high"],
        [part="priority"][data-priority="urgent"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="risk"][data-risk="medium"],
        [part="priority"][data-priority="high"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 18%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 46%, black 54%);
        }

        [part="due"] {
          margin-left: auto;
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          white-space: nowrap;
        }

        [part="due"][data-bucket="overdue"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
          font-weight: 700;
        }

        [part="row-actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        [part="row-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.28rem 0.6rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row-action"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="row-action"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

export class WorkQueue extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["assignee-id", "heading", "reference-time", "token"];
  }

  private controller: WorkQueueController | null = null;

  private ownsController = false;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: WorkQueueTransport | null = null;

  private hostEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "My work";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get token(): string | null {
    return this.getAttribute("token");
  }

  set token(value: string | null) {
    if (!value) {
      this.removeAttribute("token");
      return;
    }
    this.setAttribute("token", value);
  }

  /** The current user; enables per-row Claim on unassigned open items. */
  get assigneeId(): string | null {
    return this.getAttribute("assignee-id");
  }

  set assigneeId(value: string | null) {
    if (!value) {
      this.removeAttribute("assignee-id");
      return;
    }
    this.setAttribute("assignee-id", value);
  }

  /** ISO reference time for the urgency buckets; defaults to now. */
  get referenceTime(): string | null {
    return this.getAttribute("reference-time");
  }

  set referenceTime(value: string | null) {
    if (!value) {
      this.removeAttribute("reference-time");
      return;
    }
    this.setAttribute("reference-time", value);
  }

  get transport(): WorkQueueTransport | null {
    return this.transportValue;
  }

  set transport(value: WorkQueueTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  /**
   * The live session controller. Assign one to share a session with another
   * projection (e.g. a `box-workload-board` on the same page); otherwise the
   * element creates and owns its own from `transport` + `token`.
   */
  get queueController(): WorkQueueController | null {
    return this.controller;
  }

  set queueController(value: WorkQueueController | null) {
    this.adoptController(value);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "token") {
      this.scheduleStart();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  async setFilters(patch: WorkQueueFilters): Promise<void> {
    await this.controller?.setFilters(patch);
  }

  async refresh(): Promise<void> {
    await this.controller?.reload();
  }

  private now(): Date {
    const raw = this.referenceTime;
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }

  private scheduleStart(): void {
    if (this.pendingStart) {
      return;
    }
    this.pendingStart = true;
    queueMicrotask(() => {
      this.pendingStart = false;
      this.startController();
    });
  }

  private startController(): void {
    if (!this.isConnected || (this.controller && !this.ownsController)) {
      return;
    }

    if (!this.transportValue || !this.token) {
      this.teardownController();
      if (this.isRendered) {
        this.update();
      }
      return;
    }

    this.teardownController();
    const controller = new WorkQueueController({
      token: this.token,
      transport: this.transportValue,
    });
    this.controller = controller;
    this.ownsController = true;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
    void controller.connect();
  }

  private adoptController(controller: WorkQueueController | null): void {
    this.teardownController();
    if (!controller) {
      if (this.isRendered) {
        this.update();
      }
      // Fall back to the documented owned session from transport + token.
      this.scheduleStart();
      return;
    }
    this.controller = controller;
    this.ownsController = false;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
  }

  private subscribeToController(controller: WorkQueueController): void {
    const events: Array<[keyof WorkQueueEvents, string]> = [
      ["itemsChanged", "items-changed"],
      ["loadingChanged", "loading-changed"],
      ["loadFailed", "load-failed"],
      ["filtersChanged", "filters-changed"],
      ["itemMutated", "item-mutated"],
      ["mutationFailed", "mutation-failed"],
    ];

    this.unsubscribeFns = events.map(([eventName, domEventName]) =>
      controller.subscribe(eventName, payload => {
        this.dispatchEvent(
          new CustomEvent(domEventName, {
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

  private teardownController(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];

    if (this.controller && this.ownsController) {
      this.controller.disconnect();
      this.controller.destroy();
    }
    this.controller = null;
    this.ownsController = false;
  }

  private rowActionsHtml(item: WorkItem): string {
    const transport = this.controller?.config.transport;
    const actions: Array<{ action: string; label: string }> = [];

    if (
      transport?.claimItem &&
      item.status === "open" &&
      !item.assignee &&
      this.assigneeId
    ) {
      actions.push({ action: "claim", label: "Claim" });
    }
    if (transport?.completeItem && item.status !== "completed") {
      actions.push({ action: "complete", label: "Complete" });
    }
    if (transport?.escalateItem && item.status !== "completed" && item.status !== "escalated") {
      actions.push({ action: "escalate", label: "Escalate" });
    }
    if (transport?.reassignItem) {
      actions.push({ action: "reassign", label: "Reassign" });
    }

    return actions
      .map(
        ({ action, label }) => `
          <button
            type="button"
            part="row-action"
            data-action="${action}"
            data-item-id="${escapeHtml(item.id)}"
            aria-label="${label} ${escapeHtml(item.title)}"
          >${label}</button>
        `,
      )
      .join("");
  }

  private rowHtml(item: WorkItem, bucket: DueBucket): string {
    const due = item.dueAt ? formatItemDate(item.dueAt) : "";
    return `
      <li part="row" data-item-id="${escapeHtml(item.id)}" data-bucket="${bucket}" data-status="${escapeHtml(item.status)}">
        <div part="row-header">
          <button type="button" part="row-title" data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>
          <span part="type">${escapeHtml(item.type)}</span>
          ${item.riskLevel ? `<span part="risk" data-risk="${escapeHtml(item.riskLevel)}">Risk: ${escapeHtml(item.riskLevel)}</span>` : ""}
          ${item.priority ? `<span part="priority" data-priority="${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span>` : ""}
          ${item.assignee ? `<span part="assignee">${escapeHtml(item.assignee.name)}</span>` : ""}
          ${due ? `<time part="due" data-bucket="${bucket}" datetime="${escapeHtml(item.dueAt ?? "")}">${bucket === "overdue" ? "Overdue · " : ""}${escapeHtml(due)}</time>` : ""}
        </div>
        ${item.entityRef?.label ? `<span part="entity">${escapeHtml(item.entityRef.label)}</span>` : ""}
        <div part="row-actions">${this.rowActionsHtml(item)}</div>
      </li>
    `;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
    this.hostEl = this.shadowRoot.querySelector('[part="content-host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const actionButton = target.closest('[part="row-action"]') as HTMLButtonElement | null;
      if (actionButton && this.hostEl.contains(actionButton)) {
        const itemId = actionButton.getAttribute("data-item-id") ?? "";
        const action = actionButton.getAttribute("data-action") ?? "";
        const item = this.controller?.getItem(itemId);
        if (!item) {
          return;
        }
        if (action === "claim" && this.assigneeId) {
          void this.controller?.claimItem(itemId, this.assigneeId);
        } else if (action === "complete") {
          void this.controller?.completeItem(itemId);
        } else if (action === "escalate") {
          void this.controller?.escalateItem(itemId);
        } else if (action === "reassign") {
          // Reassignment needs a target person — the host owns that choice
          // (confirm-before-apply), so this only surfaces intent.
          this.dispatchEvent(
            new CustomEvent("reassign-requested", {
              bubbles: true,
              composed: true,
              detail: { item },
            }),
          );
        }
        return;
      }

      const titleButton = target.closest('[part="row-title"]') as HTMLButtonElement | null;
      if (titleButton && this.hostEl.contains(titleButton)) {
        const item = this.controller?.getItem(titleButton.getAttribute("data-item-id") ?? "");
        if (item) {
          this.dispatchEvent(
            new CustomEvent("item-selected", {
              bubbles: true,
              composed: true,
              detail: { item },
            }),
          );
        }
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    // Sample in-element focus before the rebuild so a mutation-driven
    // re-render puts focus back on the equivalent control.
    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusKey =
      active && this.hostEl.contains(active)
        ? {
            part: active.getAttribute("part") ?? "",
            itemId: active.getAttribute("data-item-id"),
            action: active.getAttribute("data-action"),
          }
        : null;

    const state = this.controller?.getState() ?? null;
    const items = state?.items ?? [];
    const now = this.now();

    const buckets = new Map<DueBucket, WorkItem[]>();
    for (const item of items) {
      const bucket = resolveDueBucket(item.dueAt, now);
      const list = buckets.get(bucket) ?? [];
      list.push(item);
      buckets.set(bucket, list);
    }

    const sections = DUE_BUCKET_ORDER.filter(bucket => buckets.get(bucket)?.length)
      .map(bucket => {
        const bucketItems = buckets.get(bucket)!;
        return `
          <section part="bucket" data-bucket="${bucket}">
            <h3 part="bucket-title">${DUE_BUCKET_LABELS[bucket]} (${String(bucketItems.length)})</h3>
            <ul part="items" role="list">${bucketItems.map(item => this.rowHtml(item, bucket)).join("")}</ul>
          </section>
        `;
      })
      .join("");

    this.hostEl.innerHTML = `
      <section part="panel" aria-busy="${state?.loading ? "true" : "false"}" aria-label="${escapeHtml(this.heading)}">
        <h2 part="title">${escapeHtml(this.heading)}</h2>
        ${state?.error ? `<p part="error" role="alert">${escapeHtml(state.error)}</p>` : ""}
        ${sections || `<div part="empty">No work items.</div>`}
      </section>
    `;

    if (focusKey?.part) {
      const target = Array.from(this.hostEl.querySelectorAll(`[part="${focusKey.part}"]`)).find(
        node =>
          node.getAttribute("data-item-id") === focusKey.itemId &&
          (!focusKey.action || node.getAttribute("data-action") === focusKey.action),
      ) as HTMLElement | undefined;
      target?.focus();
    }
  }
}

WorkQueue.register();
