import {
  countUnreadNotifications,
  groupNotifications,
  isNotificationItemRecord,
  resolveNotificationFilter,
} from "./types.js";
import type { NotificationFilter, NotificationItem } from "./types.js";
import { BaseElement } from "../../core/index.js";
import { isSafeHref } from "../internal/safe-href.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-notification-inbox";

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

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="panel"] {
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          max-block-size: 32rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="unread-pill"] {
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 78%, black 22%);
          font-size: 0.72rem;
          font-weight: 700;
        }

        [part="mark-all"] {
          margin-inline-start: auto;
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.3rem 0.55rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: ${boeRadius.control};
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="mark-all"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="mark-all"]:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        [part="filters"] {
          display: inline-flex;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: 999px;
          overflow: hidden;
          justify-self: start;
        }

        [part="filter"] {
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.25rem 0.7rem;
          border: none;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="filter"][aria-pressed="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="groups"] {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.6rem;
          overflow-y: auto;
        }

        [part="group-label"] {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          padding-block-end: 0.2rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="group-unread"] {
          text-transform: none;
          letter-spacing: normal;
          font-size: 0.7rem;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 78%, black 22%);
        }

        [part="items"] {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.3rem;
        }

        [part="item"] {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.5rem;
          align-items: start;
          padding: 0.5rem 0.55rem;
          border-radius: ${boeRadius.med};
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, transparent);
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="item"][data-read="true"] {
          background: transparent;
        }

        [part="unread-dot"] {
          inline-size: 0.5rem;
          block-size: 0.5rem;
          margin-block-start: 0.4rem;
          border-radius: 999px;
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item"][data-read="true"] [part="unread-dot"] {
          background: transparent;
        }

        [part="item-body"] {
          display: grid;
          gap: 0.15rem;
          min-inline-size: 0;
        }

        [part="item-title"] {
          appearance: none;
          padding: 0;
          border: none;
          background: none;
          font: inherit;
          font-weight: 600;
          text-align: start;
          color: var(--boe-token-text-text, #1f1e1b);
          cursor: pointer;
        }

        [part="item"][data-read="true"] [part="item-title"] {
          font-weight: 400;
        }

        [part="item-title"]:hover {
          text-decoration: underline;
        }

        [part="item-meta"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="summary"] {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.45;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="entity"] {
          align-self: start;
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--boe-token-surface-surface-brand, #0061d5);
          text-decoration: none;
        }

        [part="item-actions"] {
          display: flex;
          gap: 0.25rem;
        }

        [part="item-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.72rem;
          padding: 0.2rem 0.4rem;
          border: 1px solid transparent;
          border-radius: ${boeRadius.size};
          background: none;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="item-action"]:hover {
          border-color: var(--boe-token-stroke-stroke, #e8e8e8);
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          text-align: center;
        }

        [part="filter"]:focus-visible,
        [part="mark-all"]:focus-visible,
        [part="item-title"]:focus-visible,
        [part="item-action"]:focus-visible,
        [part="entity"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          [part="item"] {
            transition: none;
          }
        }
      `;

/**
 * The triage inbox: approvals waiting, SLA breaches, mentions — grouped by
 * type, filterable to unread, with per-row and bulk intents.
 *
 * Toasts are the wrong surface for this: they are transient and unordered,
 * while triage needs a list you can come back to. Sections lead with the most
 * unread so what needs attention rises to the top.
 *
 * Mutations are intents, not state changes. The element never marks anything
 * read on its own — the host owns the write and feeds back a new list, so the
 * inbox can never disagree with the server about what has been seen.
 */
export class NotificationInbox extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["filter", "heading", "notifications", "type-labels"];
  }

  private panelEl!: HTMLElement;

  private titleEl!: HTMLElement;

  private unreadPillEl!: HTMLElement;

  private markAllEl!: HTMLButtonElement;

  private filtersEl!: HTMLElement;

  private groupsEl!: HTMLElement;

  private emptyEl!: HTMLElement;

  private signature = "";

  private notificationsRaw: string | null = null;

  private notificationsCache: NotificationItem[] = [];

  get heading(): string {
    return this.getAttribute("heading") ?? "Notifications";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get filter(): NotificationFilter {
    return resolveNotificationFilter(this.getAttribute("filter"));
  }

  set filter(value: NotificationFilter) {
    this.setAttribute("filter", resolveNotificationFilter(value));
  }

  /** Notification records; JSON payloads are validated per record. */
  get notifications(): NotificationItem[] {
    const raw = this.getAttribute("notifications");
    if (!raw) {
      return [];
    }
    if (raw !== this.notificationsRaw) {
      this.notificationsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.notificationsCache =
          Array.isArray(parsed) && parsed.every(isNotificationItemRecord)
            ? (parsed as NotificationItem[])
            : [];
      } catch {
        this.notificationsCache = [];
      }
    }
    return [...this.notificationsCache];
  }

  set notifications(value: NotificationItem[]) {
    if (value.length) {
      this.setAttribute("notifications", JSON.stringify(value));
      return;
    }
    this.removeAttribute("notifications");
  }

  /** Optional `{ type: heading }` map; unmapped types are humanized. */
  get typeLabels(): Record<string, string> {
    const raw = this.getAttribute("type-labels");
    if (!raw) {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return {};
      }
      const entries = Object.entries(parsed as Record<string, unknown>).filter(
        ([, value]) => typeof value === "string",
      ) as Array<[string, string]>;
      return Object.fromEntries(entries);
    } catch {
      return {};
    }
  }

  set typeLabels(value: Record<string, string>) {
    if (Object.keys(value).length) {
      this.setAttribute("type-labels", JSON.stringify(value));
      return;
    }
    this.removeAttribute("type-labels");
  }

  get unreadCount(): number {
    return countUnreadNotifications(this.notifications);
  }

  /** The records currently on screen, after the filter. */
  get visibleNotifications(): NotificationItem[] {
    return groupNotifications(this.notifications, {
      filter: this.filter,
      typeLabels: this.typeLabels,
    }).flatMap(group => group.items);
  }

  private emitIntent(name: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  private itemHtml(item: NotificationItem): string {
    const read = Boolean(item.read);
    const entity = item.entityRef;
    const entityHtml = entity
      ? entity.href && isSafeHref(entity.href)
        ? `<a part="entity" href="${escapeHtml(entity.href)}" data-item-id="${escapeHtml(item.id)}">${escapeHtml(entity.label)}</a>`
        : `<span part="entity">${escapeHtml(entity.label)}</span>`
      : "";

    return `
      <li part="item" data-item-id="${escapeHtml(item.id)}" data-read="${String(read)}" data-type="${escapeHtml(item.type)}">
        <span part="unread-dot" aria-hidden="true"></span>
        <span part="item-body">
          <button type="button" part="item-title" data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>
          ${item.summary ? `<p part="summary">${escapeHtml(item.summary)}</p>` : ""}
          <span part="item-meta">
            ${item.actor ? `<span part="actor">${escapeHtml(item.actor.name)}</span>` : ""}
            ${item.timestamp ? `<time part="timestamp" datetime="${escapeHtml(item.timestamp)}">${escapeHtml(item.timestamp)}</time>` : ""}
            ${entityHtml}
          </span>
        </span>
        <span part="item-actions">
          ${
            read
              ? ""
              : `<button type="button" part="item-action" data-action="read" data-item-id="${escapeHtml(item.id)}" aria-label="Mark ${escapeHtml(item.title)} as read">Mark read</button>`
          }
          <button type="button" part="item-action" data-action="dismiss" data-item-id="${escapeHtml(item.id)}" aria-label="Dismiss ${escapeHtml(item.title)}">Dismiss</button>
        </span>
      </li>
    `;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel" aria-labelledby="inbox-title">
        <div part="header">
          <h2 part="title" id="inbox-title"></h2>
          <span part="unread-pill" hidden></span>
          <button type="button" part="mark-all">Mark all read</button>
        </div>
        <div part="filters" role="group" aria-label="Filter notifications">
          <button type="button" part="filter" data-filter="all" aria-pressed="true">All</button>
          <button type="button" part="filter" data-filter="unread" aria-pressed="false">Unread</button>
        </div>
        <ul part="groups" role="list"></ul>
        <div part="empty" hidden>You're all caught up.</div>
      </section>
    `;

    const root = this.shadowRoot;
    this.panelEl = root.querySelector('[part="panel"]')!;
    this.titleEl = root.querySelector('[part="title"]')!;
    this.unreadPillEl = root.querySelector('[part="unread-pill"]')!;
    this.markAllEl = root.querySelector('[part="mark-all"]')!;
    this.filtersEl = root.querySelector('[part="filters"]')!;
    this.groupsEl = root.querySelector('[part="groups"]')!;
    this.emptyEl = root.querySelector('[part="empty"]')!;
  }

  protected setupListeners(): void {
    this.filtersEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="filter"]') as HTMLElement | null;
      if (!button) {
        return;
      }
      const next = resolveNotificationFilter(button.getAttribute("data-filter"));
      if (next === this.filter) {
        return;
      }
      this.filter = next;
      this.emitIntent("filter-changed", { filter: next });
    });

    this.markAllEl.addEventListener("click", () => {
      const unread = this.notifications.filter(item => !item.read);
      if (unread.length === 0) {
        return;
      }
      this.emitIntent("mark-all-read-requested", { items: unread });
    });

    this.groupsEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const action = target.closest('[part="item-action"]') as HTMLElement | null;
      if (action && this.groupsEl.contains(action)) {
        const item = this.notifications.find(
          entry => entry.id === (action.getAttribute("data-item-id") ?? ""),
        );
        if (!item) {
          return;
        }
        this.emitIntent(
          action.getAttribute("data-action") === "read"
            ? "mark-read-requested"
            : "dismiss-requested",
          { item },
        );
        return;
      }

      const title = target.closest('[part="item-title"]') as HTMLElement | null;
      if (title && this.groupsEl.contains(title)) {
        const item = this.notifications.find(
          entry => entry.id === (title.getAttribute("data-item-id") ?? ""),
        );
        if (item) {
          this.emitIntent("notification-selected", { item });
        }
      }
    });
  }

  protected update(): void {
    if (!this.groupsEl) {
      return;
    }

    const all = this.notifications;
    const unread = countUnreadNotifications(all);
    const filter = this.filter;

    this.titleEl.textContent = this.heading;
    this.unreadPillEl.hidden = unread === 0;
    this.unreadPillEl.textContent = `${String(unread)} unread`;
    this.markAllEl.disabled = unread === 0;

    for (const button of Array.from(this.filtersEl.querySelectorAll('[part="filter"]'))) {
      button.setAttribute(
        "aria-pressed",
        button.getAttribute("data-filter") === filter ? "true" : "false",
      );
    }

    const groups = groupNotifications(all, { filter, typeLabels: this.typeLabels });
    const signature = JSON.stringify([this.getAttribute("notifications") ?? "", filter, this.typeLabels]);
    if (signature !== this.signature) {
      this.signature = signature;

      // Sample focus before the rebuild so acting on a row does not drop the
      // reader back to the top of the panel.
      const active = this.shadowRoot?.activeElement as HTMLElement | null;
      const focusKey =
        active && this.groupsEl.contains(active)
          ? {
              part: active.getAttribute("part") ?? "",
              itemId: active.getAttribute("data-item-id"),
              action: active.getAttribute("data-action"),
            }
          : null;

      this.groupsEl.innerHTML = groups
        .map(
          group => `
            <li part="group" data-group-key="${escapeHtml(group.key)}">
              <span part="group-label">
                ${escapeHtml(group.label)}
                ${group.unread ? `<span part="group-unread">${String(group.unread)} unread</span>` : ""}
              </span>
              <ul part="items" role="list">${group.items.map(item => this.itemHtml(item)).join("")}</ul>
            </li>
          `,
        )
        .join("");

      if (focusKey?.part) {
        const restored = Array.from(
          this.groupsEl.querySelectorAll(`[part="${focusKey.part}"]`),
        ).find(
          node =>
            node.getAttribute("data-item-id") === focusKey.itemId &&
            node.getAttribute("data-action") === focusKey.action,
        ) as HTMLElement | undefined;
        restored?.focus();
      }
    }

    const empty = groups.length === 0;
    this.groupsEl.hidden = empty;
    this.emptyEl.hidden = !empty;
    this.emptyEl.textContent =
      filter === "unread" && all.length > 0 ? "No unread notifications." : "You're all caught up.";
    this.panelEl.setAttribute("aria-label", this.heading);
  }
}

NotificationInbox.register();
