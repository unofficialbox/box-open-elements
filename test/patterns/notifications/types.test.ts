import { describe, expect, it } from "vitest";

import {
  countUnreadNotifications,
  groupNotifications,
  isNotificationItemRecord,
  resolveNotificationFilter,
  resolveNotificationTone,
} from "../../../src/patterns/notifications/types.js";
import type { NotificationItem } from "../../../src/patterns/notifications/types.js";

const items: NotificationItem[] = [
  { id: "n1", title: "Approval needed on MSA_Acme_v4", type: "approval", timestamp: "2026-08-13T09:00:00.000Z" },
  { id: "n2", title: "Approval needed on NDA_Globex", type: "approval", timestamp: "2026-08-13T11:00:00.000Z" },
  { id: "n3", title: "Read approval", type: "approval", read: true, timestamp: "2026-08-13T12:00:00.000Z" },
  { id: "n4", title: "SLA breach on clause review", type: "sla-breach", timestamp: "2026-08-12T08:00:00.000Z" },
  { id: "n5", title: "Morgan mentioned you", type: "mention", read: true, timestamp: "2026-08-11T08:00:00.000Z" },
  { id: "n6", title: "Jordan mentioned you", type: "mention", read: true },
];

describe("countUnreadNotifications", () => {
  it("counts only unread records", () => {
    expect(countUnreadNotifications(items)).toBe(3);
    expect(countUnreadNotifications([])).toBe(0);
    expect(countUnreadNotifications(items.filter(item => item.read))).toBe(0);
  });
});

describe("resolveNotificationTone / resolveNotificationFilter", () => {
  it("falls back for unknown values", () => {
    expect(resolveNotificationTone("warning")).toBe("warning");
    expect(resolveNotificationTone("nonsense")).toBe("neutral");
    expect(resolveNotificationFilter("unread")).toBe("unread");
    expect(resolveNotificationFilter("nonsense")).toBe("all");
    expect(resolveNotificationFilter(null)).toBe("all");
  });
});

describe("groupNotifications", () => {
  it("leads with the section holding the most unread", () => {
    const groups = groupNotifications(items);
    // approval has 2 unread, sla-breach 1, mention 0.
    expect(groups.map(group => group.key)).toEqual(["approval", "sla-breach", "mention"]);
    expect(groups.map(group => group.unread)).toEqual([2, 1, 0]);
  });

  it("humanizes a type slug into a heading", () => {
    expect(groupNotifications(items).map(group => group.label)).toEqual([
      "Approval",
      "Sla breach",
      "Mention",
    ]);
  });

  it("prefers a supplied label over the derived one", () => {
    const groups = groupNotifications(items, { typeLabels: { "sla-breach": "SLA breaches" } });
    expect(groups.find(group => group.key === "sla-breach")?.label).toBe("SLA breaches");
    // Unmapped types still humanize.
    expect(groups.find(group => group.key === "approval")?.label).toBe("Approval");
  });

  it("puts unread ahead of read, then newest first", () => {
    const groups = groupNotifications(items);
    // n3 is newer than both unread approvals but has been read, so it trails.
    expect(groups[0]?.items.map(item => item.id)).toEqual(["n2", "n1", "n3"]);
  });

  it("sinks undated items without reordering them among themselves", () => {
    const mixed: NotificationItem[] = [
      { id: "a", title: "A", type: "x", read: true },
      { id: "b", title: "B", type: "x", read: true, timestamp: "2026-08-01T00:00:00.000Z" },
      { id: "c", title: "C", type: "x", read: true },
    ];
    expect(groupNotifications(mixed)[0]?.items.map(item => item.id)).toEqual(["b", "a", "c"]);
  });

  it("drops read records and empty sections under the unread filter", () => {
    const groups = groupNotifications(items, { filter: "unread" });
    expect(groups.map(group => group.key)).toEqual(["approval", "sla-breach"]);
    expect(groups.flatMap(group => group.items).every(item => !item.read)).toBe(true);
  });

  it("breaks ties by item count then label, never by input order", () => {
    const tied: NotificationItem[] = [
      { id: "1", title: "One", type: "zebra", read: true },
      { id: "2", title: "Two", type: "alpha", read: true },
    ];
    expect(groupNotifications(tied).map(group => group.key)).toEqual(["alpha", "zebra"]);
  });

  it("returns nothing for an empty set", () => {
    expect(groupNotifications([])).toEqual([]);
    expect(groupNotifications(items.filter(item => item.read), { filter: "unread" })).toEqual([]);
  });
});

describe("isNotificationItemRecord", () => {
  it("requires a non-empty id, title, and type", () => {
    expect(isNotificationItemRecord({ id: "a", title: "T", type: "approval" })).toBe(true);
    expect(isNotificationItemRecord({ id: "", title: "T", type: "approval" })).toBe(false);
    expect(isNotificationItemRecord({ id: "a", title: "", type: "approval" })).toBe(false);
    expect(isNotificationItemRecord({ id: "a", title: "T", type: "" })).toBe(false);
    expect(isNotificationItemRecord({ id: "a", title: "T" })).toBe(false);
    expect(isNotificationItemRecord(null)).toBe(false);
  });

  it("validates a nested entityRef", () => {
    const base = { id: "a", title: "T", type: "approval" };
    expect(isNotificationItemRecord({ ...base, entityRef: { id: "e", label: "L" } })).toBe(true);
    expect(isNotificationItemRecord({ ...base, entityRef: { id: "e" } })).toBe(false);
    expect(isNotificationItemRecord({ ...base, entityRef: "nope" })).toBe(false);
  });
});
