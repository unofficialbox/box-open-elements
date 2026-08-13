import { WorkQueueController } from "./controller.js";
import { resolveDueBucket, summarizeWorkload } from "./types.js";
import type {
  WorkItem,
  WorkItemAssignee,
  WorkItemStatus,
  WorkQueueEvents,
  WorkQueueTransport,
  WorkloadLane,
} from "./types.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-workload-board";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const STATUS_LANES: Array<{ status: WorkItemStatus; label: string }> = [
  { status: "open", label: "Open" },
  { status: "in-progress", label: "In progress" },
  { status: "escalated", label: "Escalated" },
  { status: "completed", label: "Completed" },
];


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

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: ${boePanel.gap};
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="summary"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-left: auto;
        }

        [part="summary-chip"] {
          display: inline-flex;
          gap: 0.3rem;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        [part="summary-chip"][data-metric="overdue"][data-nonzero="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
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

        [part="lanes"] {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(220px, 1fr);
          gap: ${boePanel.gap};
          overflow-x: auto;
          align-items: start;
        }

        [part="lane"] {
          display: grid;
          gap: 0.45rem;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boeRadius.large};
          background: var(--boe-token-surface-surface-secondary, #fbfbfb);
        }

        [part="lane"][data-over-capacity="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 55%, transparent);
        }

        [part="lane-header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }

        [part="lane-avatar"] {
          display: inline-grid;
          place-items: center;
          inline-size: 1.7rem;
          block-size: 1.7rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        [part="lane-name"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="lane-count"],
        [part="lane-overdue"] {
          display: inline-flex;
          padding: 0.12rem 0.42rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.72rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        [part="lane-overdue"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="cards"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.4rem;
        }

        [part="card"] {
          display: grid;
          gap: 0.28rem;
          padding: 0.5rem 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boeRadius.med};
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="card"][data-overdue="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 40%, transparent);
        }

        [part="card-title"] {
          appearance: none;
          border: none;
          background: transparent;
          padding: 0;
          font: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
          text-align: left;
          cursor: pointer;
        }

        [part="card-title"]:hover {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="card-title"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          border-radius: ${boeRadius.med};
        }

        [part="card-meta"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="card-type"] {
          display: inline-flex;
          padding: 0.12rem 0.4rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          font-weight: 600;
        }

        [part="card-due"][data-overdue="true"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
          font-weight: 700;
        }

        [part="card-reassign"] {
          appearance: none;
          justify-self: start;
          font: inherit;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 0.22rem 0.5rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="card-reassign"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="card-reassign"]:focus-visible {
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

export class WorkloadBoard extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["heading", "lane-by", "reference-time", "token", "wip-limit"];
  }

  private controller: WorkQueueController | null = null;

  private ownsController = false;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: WorkQueueTransport | null = null;

  private teamValue: WorkItemAssignee[] = [];

  private hostEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Team workload";
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

  /** Lane dimension: `assignee` (team workload, default) or `status` (pipeline). */
  get laneBy(): "assignee" | "status" {
    return this.getAttribute("lane-by") === "status" ? "status" : "assignee";
  }

  set laneBy(value: "assignee" | "status") {
    this.setAttribute("lane-by", value);
  }

  /** Items-per-person threshold that flags a lane as over capacity. */
  get wipLimit(): number | null {
    const raw = this.getAttribute("wip-limit");
    if (!raw) {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  set wipLimit(value: number | null) {
    if (typeof value === "number" && value > 0) {
      this.setAttribute("wip-limit", String(value));
      return;
    }
    this.removeAttribute("wip-limit");
  }

  /** ISO reference time for overdue detection; defaults to now. */
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

  get team(): WorkItemAssignee[] {
    return this.teamValue;
  }

  set team(value: WorkItemAssignee[]) {
    this.teamValue = value;
    if (this.isRendered) {
      this.update();
    }
  }

  get transport(): WorkQueueTransport | null {
    return this.transportValue;
  }

  set transport(value: WorkQueueTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  /**
   * The live session controller. Assign one to share a session with a
   * `box-work-queue` on the same page; otherwise the element creates and
   * owns its own from `transport` + `token`.
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
      team: this.teamValue,
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

  private cardHtml(item: WorkItem, now: Date): string {
    const overdue = resolveDueBucket(item.dueAt, now) === "overdue" && item.status !== "completed";
    const due = item.dueAt ? formatItemDate(item.dueAt) : "";
    const canReassign = Boolean(this.controller?.config.transport.reassignItem);

    return `
      <li part="card" data-item-id="${escapeHtml(item.id)}" data-status="${item.status}" data-overdue="${overdue ? "true" : "false"}">
        <button type="button" part="card-title" data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>
        <div part="card-meta">
          <span part="card-type">${escapeHtml(item.type)}</span>
          ${item.riskLevel ? `<span>Risk: ${item.riskLevel}</span>` : ""}
          ${due ? `<time part="card-due" data-overdue="${overdue ? "true" : "false"}" datetime="${escapeHtml(item.dueAt ?? "")}">${overdue ? "Overdue · " : ""}${escapeHtml(due)}</time>` : ""}
        </div>
        ${canReassign ? `<button type="button" part="card-reassign" data-item-id="${escapeHtml(item.id)}" aria-label="Reassign ${escapeHtml(item.title)}">Reassign</button>` : ""}
      </li>
    `;
  }

  private laneHtml(args: {
    key: string;
    label: string;
    initials: string | null;
    items: WorkItem[];
    overdue: number;
    overCapacity: boolean;
    now: Date;
  }): string {
    return `
      <section part="lane" data-lane="${escapeHtml(args.key)}" data-over-capacity="${args.overCapacity ? "true" : "false"}" aria-label="${escapeHtml(args.label)}">
        <header part="lane-header">
          ${args.initials ? `<span part="lane-avatar" aria-hidden="true">${escapeHtml(args.initials)}</span>` : ""}
          <span part="lane-name">${escapeHtml(args.label)}</span>
          <span part="lane-count">${String(args.items.length)}</span>
          ${args.overdue > 0 ? `<span part="lane-overdue">${String(args.overdue)} overdue</span>` : ""}
        </header>
        <ul part="cards" role="list">${args.items.map(item => this.cardHtml(item, args.now)).join("")}</ul>
      </section>
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

      const reassign = target.closest('[part="card-reassign"]') as HTMLButtonElement | null;
      if (reassign && this.hostEl.contains(reassign)) {
        const item = this.controller?.getItem(reassign.getAttribute("data-item-id") ?? "");
        if (item) {
          // The host picks the target person (confirm-before-apply); the
          // board only surfaces intent.
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

      const title = target.closest('[part="card-title"]') as HTMLButtonElement | null;
      if (title && this.hostEl.contains(title)) {
        const item = this.controller?.getItem(title.getAttribute("data-item-id") ?? "");
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

    const state = this.controller?.getState() ?? null;
    const items = state?.items ?? [];
    const now = this.now();
    const wipLimit = this.wipLimit;

    let lanesMarkup = "";
    if (this.laneBy === "status") {
      lanesMarkup = STATUS_LANES.map(({ status, label }) => {
        const laneItems = items.filter(item => item.status === status);
        const overdue = laneItems.filter(
          item => resolveDueBucket(item.dueAt, now) === "overdue" && item.status !== "completed",
        ).length;
        return this.laneHtml({
          key: status,
          label,
          initials: null,
          items: laneItems,
          overdue,
          overCapacity: false,
          now,
        });
      }).join("");
    } else {
      const team = this.teamValue.length
        ? this.teamValue
        : (this.controller?.config.team ?? []);
      const lanes: WorkloadLane[] = summarizeWorkload(items, team, now);
      lanesMarkup = lanes
        .map(lane =>
          this.laneHtml({
            key: lane.assignee?.id ?? "unassigned",
            label: lane.assignee?.name ?? "Unassigned",
            initials: lane.assignee
              ? (lane.assignee.initials ?? lane.assignee.name.slice(0, 2).toUpperCase())
              : null,
            items: lane.items,
            overdue: lane.overdue,
            overCapacity: wipLimit !== null && lane.total > wipLimit,
            now,
          }),
        )
        .join("");
    }

    const totals = {
      total: items.length,
      overdue: items.filter(
        item => resolveDueBucket(item.dueAt, now) === "overdue" && item.status !== "completed",
      ).length,
      inProgress: items.filter(item => item.status === "in-progress").length,
      completed: items.filter(item => item.status === "completed").length,
    };

    this.hostEl.innerHTML = `
      <section part="panel" aria-busy="${state?.loading ? "true" : "false"}" aria-label="${escapeHtml(this.heading)}">
        <header part="header">
          <h2 part="title">${escapeHtml(this.heading)}</h2>
          <div part="summary">
            <span part="summary-chip" data-metric="total">${String(totals.total)} items</span>
            <span part="summary-chip" data-metric="overdue" data-nonzero="${totals.overdue > 0 ? "true" : "false"}">${String(totals.overdue)} overdue</span>
            <span part="summary-chip" data-metric="in-progress">${String(totals.inProgress)} in progress</span>
            <span part="summary-chip" data-metric="completed">${String(totals.completed)} done</span>
          </div>
        </header>
        ${state?.error ? `<p part="error" role="alert">${escapeHtml(state.error)}</p>` : ""}
        ${lanesMarkup ? `<div part="lanes">${lanesMarkup}</div>` : `<div part="empty">No work items.</div>`}
      </section>
    `;
  }
}

WorkloadBoard.register();
