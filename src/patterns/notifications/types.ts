/**
 * Notification model and the pure grouping/counting engine behind
 * `box-notification-inbox`. DOM-free, so a host can drive its own inbox —
 * or a bell in a different shell — from the same functions.
 */

export type NotificationTone = "neutral" | "brand" | "success" | "warning" | "error";

/** The entity a notification points at; the row links to it when `href` is safe. */
export interface NotificationEntityRef {
  id: string;
  label: string;
  href?: string;
}

/**
 * One triage-worthy event: an approval waiting, an SLA breach, a mention.
 * `type` is an open vocabulary — hosts add their own kinds without a schema
 * change, and the inbox groups by whatever it finds.
 */
export interface NotificationItem {
  id: string;
  /** Short imperative headline: "Approval needed on MSA_Acme_v4". */
  title: string;
  type: string;
  read?: boolean;
  actor?: { name: string; initials?: string };
  summary?: string;
  /** ISO timestamp; ordering is by this, newest first. */
  timestamp?: string;
  tone?: NotificationTone;
  entityRef?: NotificationEntityRef;
}

export interface NotificationGroup {
  /** The `type` value; also the collapse/section key. */
  key: string;
  label: string;
  items: NotificationItem[];
  unread: number;
}

export type NotificationFilter = "all" | "unread";

const TONES = new Set<NotificationTone>(["neutral", "brand", "success", "warning", "error"]);

export const resolveNotificationTone = (value: string | null | undefined): NotificationTone =>
  value && TONES.has(value as NotificationTone) ? (value as NotificationTone) : "neutral";

export const resolveNotificationFilter = (value: string | null | undefined): NotificationFilter =>
  value === "unread" ? "unread" : "all";

/** Unread count — what the bell shows, and the only number that must be exact. */
export const countUnreadNotifications = (items: readonly NotificationItem[]): number =>
  items.reduce((total, item) => total + (item.read ? 0 : 1), 0);

const instant = (item: NotificationItem): number | null => {
  if (!item.timestamp) {
    return null;
  }
  const value = new Date(item.timestamp).getTime();
  return Number.isNaN(value) ? null : value;
};

/** Newest first; undated items sink without reordering among themselves. */
const byNewestFirst = (left: NotificationItem, right: NotificationItem): number => {
  const a = instant(left);
  const b = instant(right);
  if (a === b) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  return b - a;
};

/**
 * Turn a `type` slug into a section heading: `sla-breach` → `Sla breach`. A
 * host wanting different wording supplies its own labels through `typeLabels`.
 */
const humanize = (value: string): string => {
  const spaced = value.replaceAll(/[-_]+/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : value;
};

export interface GroupNotificationsOptions {
  filter?: NotificationFilter;
  /** Override the derived heading for a `type`. */
  typeLabels?: Readonly<Record<string, string>>;
}

/**
 * Group notifications into sections by type.
 *
 * Sections lead with the most unread, then the most items, then the label —
 * so what needs attention rises, and the order never depends on input order.
 * Items inside a section run newest first, with unread ahead of read at the
 * same instant: this is a triage surface, not a feed.
 */
export const groupNotifications = (
  items: readonly NotificationItem[],
  options: GroupNotificationsOptions = {},
): NotificationGroup[] => {
  const filter = options.filter ?? "all";
  const labels = options.typeLabels ?? {};
  const visible = filter === "unread" ? items.filter(item => !item.read) : items;

  const groups = new Map<string, NotificationGroup>();
  for (const item of visible) {
    let group = groups.get(item.type);
    if (!group) {
      group = { key: item.type, label: labels[item.type] ?? humanize(item.type), items: [], unread: 0 };
      groups.set(item.type, group);
    }
    group.items.push(item);
    if (!item.read) {
      group.unread += 1;
    }
  }

  for (const group of groups.values()) {
    group.items.sort((left, right) => {
      if (Boolean(left.read) !== Boolean(right.read)) {
        return left.read ? 1 : -1;
      }
      return byNewestFirst(left, right);
    });
  }

  return [...groups.values()].sort((left, right) => {
    if (left.unread !== right.unread) {
      return right.unread - left.unread;
    }
    if (left.items.length !== right.items.length) {
      return right.items.length - left.items.length;
    }
    return left.label < right.label ? -1 : left.label > right.label ? 1 : 0;
  });
};

/** Attribute payloads are author input — validate every record. */
export const isNotificationItemRecord = (value: unknown): value is NotificationItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || item.id.length === 0) {
    return false;
  }
  if (typeof item.title !== "string" || item.title.length === 0) {
    return false;
  }
  if (typeof item.type !== "string" || item.type.length === 0) {
    return false;
  }
  if (item.entityRef !== undefined) {
    const entity = item.entityRef as Record<string, unknown> | null;
    if (
      typeof entity !== "object" ||
      entity === null ||
      typeof entity.id !== "string" ||
      typeof entity.label !== "string"
    ) {
      return false;
    }
  }
  return true;
};
