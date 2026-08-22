import { countUnreadNotifications, isNotificationItemRecord } from "./types.js";
import type { NotificationItem } from "./types.js";
import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-notification-bell";

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
          display: inline-block;
        }

        [part="trigger"] {
          position: relative;
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: 2.25rem;
          block-size: 2.25rem;
          padding: 0;
          border: 1px solid transparent;
          border-radius: ${boeRadius.control};
          background: none;
          color: var(--boe-token-text-text, #1f1e1b);
          font: inherit;
          font-size: 1.05rem;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="trigger"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="trigger"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="trigger"][aria-expanded="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
        }

        [part="count"] {
          position: absolute;
          inset-block-start: 0;
          inset-inline-end: 0;
          transform: translate(35%, -35%);
          min-inline-size: 1.1rem;
          padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--boe-token-surface-status-surface-error, #ed3757);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font-size: 0.68rem;
          font-weight: 700;
          line-height: 1.1rem;
          text-align: center;
        }

        [part="count"][data-dot="true"] {
          min-inline-size: 0.5rem;
          block-size: 0.5rem;
          padding: 0;
        }
      `;

/**
 * The bell: an unread count over a trigger, for the app chrome.
 *
 * The count is the accessible name, not decoration — "Notifications, 3
 * unread" — because a red dot alone tells a screen-reader user nothing. Past
 * `max` the badge reads "9+" while the label still states the true count,
 * since the abbreviation is a layout concession and the number is the fact.
 */
export class NotificationBell extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["expanded", "label", "max", "notifications", "unread-count"];
  }

  private triggerEl!: HTMLButtonElement;

  private countEl!: HTMLElement;

  private notificationsRaw: string | null = null;

  private notificationsCache: NotificationItem[] = [];

  get label(): string {
    return this.getAttribute("label") ?? "Notifications";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  /** Largest number rendered before the badge abbreviates, e.g. `9+`. */
  get max(): number {
    const raw = Number.parseInt(this.getAttribute("max") ?? "", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 99;
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get expanded(): boolean {
    return this.hasAttribute("expanded");
  }

  set expanded(value: boolean) {
    this.toggleAttribute("expanded", value);
  }

  /** Optional records; supply these or `unread-count`, not both. */
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

  /**
   * Unread total. Derived from `notifications` when they are supplied;
   * otherwise read from the attribute, so a host that keeps the list on the
   * server can still drive the badge with one number.
   */
  get unreadCount(): number {
    if (this.hasAttribute("notifications")) {
      return countUnreadNotifications(this.notifications);
    }
    const raw = Number.parseInt(this.getAttribute("unread-count") ?? "", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  set unreadCount(value: number) {
    this.setAttribute("unread-count", String(Math.max(0, Math.trunc(value))));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <button type="button" part="trigger" aria-expanded="false" aria-haspopup="dialog">
        <span part="icon" aria-hidden="true">🔔</span>
        <span part="count" aria-hidden="true" hidden></span>
      </button>
    `;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.countEl = this.shadowRoot.querySelector('[part="count"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("click", () => {
      const expanded = !this.expanded;
      this.expanded = expanded;
      this.dispatchEvent(
        new CustomEvent("toggle", {
          bubbles: true,
          composed: true,
          detail: { expanded, unreadCount: this.unreadCount },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.triggerEl) {
      return;
    }

    const unread = this.unreadCount;
    const max = this.max;
    this.countEl.hidden = unread === 0;
    this.countEl.textContent = unread > max ? `${String(max)}+` : String(unread);
    // A zero-width badge would be invisible; a dot is the honest minimum.
    this.countEl.setAttribute("data-dot", String(this.countEl.textContent === ""));

    // The abbreviated badge is a layout concession — the label keeps the
    // real number so assistive tech is never told "9+" when it is 240.
    const suffix = unread === 0 ? "no unread" : `${String(unread)} unread`;
    this.triggerEl.setAttribute("aria-label", `${escapeHtml(this.label)}, ${suffix}`);
    this.triggerEl.setAttribute("aria-expanded", String(this.expanded));
  }
}

NotificationBell.register();
