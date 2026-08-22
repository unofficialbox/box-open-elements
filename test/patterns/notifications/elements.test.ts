import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "../../../src/patterns/notifications/notification-bell.js";
import { NotificationInbox } from "../../../src/patterns/notifications/notification-inbox.js";
import type { NotificationItem } from "../../../src/patterns/notifications/types.js";

NotificationBell.register();
NotificationInbox.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const items: NotificationItem[] = [
  {
    id: "n1",
    title: "Approval needed on MSA_Acme_v4",
    type: "approval",
    summary: "Second-line approval is blocking execution.",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-08-13T09:00:00.000Z",
    tone: "warning",
    entityRef: { id: "msa-acme", label: "MSA_Acme_v4", href: "/contracts/acme" },
  },
  { id: "n2", title: "Approval needed on NDA_Globex", type: "approval", timestamp: "2026-08-13T11:00:00.000Z" },
  { id: "n3", title: "Read approval", type: "approval", read: true, timestamp: "2026-08-13T12:00:00.000Z" },
  { id: "n4", title: "SLA breach on clause review", type: "sla-breach", timestamp: "2026-08-12T08:00:00.000Z" },
  { id: "n5", title: "Morgan mentioned you", type: "mention", read: true, timestamp: "2026-08-11T08:00:00.000Z" },
];

const mountInbox = async (
  configure: (element: NotificationInbox) => void = () => {},
): Promise<NotificationInbox> => {
  const element = document.createElement("box-notification-inbox") as NotificationInbox;
  element.notifications = items;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const mountBell = async (
  configure: (element: NotificationBell) => void = () => {},
): Promise<NotificationBell> => {
  const element = document.createElement("box-notification-bell") as NotificationBell;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const q = (element: HTMLElement, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

const all = (element: HTMLElement, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-notification-bell", () => {
  it("puts the unread count in the accessible name, not just the badge", async () => {
    const element = await mountBell(el => (el.notifications = items));

    expect(q(element, '[part="count"]')?.textContent).toBe("3");
    expect(q(element, '[part="trigger"]')?.getAttribute("aria-label")).toBe(
      "Notifications, 3 unread",
    );
  });

  it("says 'no unread' and hides the badge at zero", async () => {
    const element = await mountBell(el => (el.notifications = items.filter(item => item.read)));

    expect(q(element, '[part="count"]')?.hidden).toBe(true);
    expect(q(element, '[part="trigger"]')?.getAttribute("aria-label")).toBe(
      "Notifications, no unread",
    );
  });

  it("abbreviates the badge past max while the label keeps the true count", async () => {
    const element = await mountBell(el => {
      el.max = 9;
      el.unreadCount = 240;
    });

    expect(q(element, '[part="count"]')?.textContent).toBe("9+");
    // The abbreviation is a layout concession; assistive tech gets the number.
    expect(q(element, '[part="trigger"]')?.getAttribute("aria-label")).toBe(
      "Notifications, 240 unread",
    );
  });

  it("derives the count from records when supplied, ignoring the attribute", async () => {
    const element = await mountBell(el => {
      el.unreadCount = 99;
      el.notifications = items;
    });

    expect(element.unreadCount).toBe(3);
  });

  it("toggles and reports expansion", async () => {
    const element = await mountBell(el => (el.notifications = items));
    const toggled = vi.fn();
    element.addEventListener("toggle", toggled);

    const trigger = q(element, '[part="trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();
    await flush();
    expect(element.expanded).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(toggled.mock.calls[0]?.[0].detail).toEqual({ expanded: true, unreadCount: 3 });

    trigger.click();
    await flush();
    expect(element.expanded).toBe(false);
  });

  it("ignores a malformed payload", async () => {
    const element = document.createElement("box-notification-bell") as NotificationBell;
    element.setAttribute("notifications", '[{"id":"ok","title":"T","type":"a"},{"title":"no id"}]');
    document.body.append(element);
    await flush();

    expect(element.notifications).toEqual([]);
    expect(element.unreadCount).toBe(0);
  });
});

describe("box-notification-inbox", () => {
  it("groups by type with the most unread section first", async () => {
    const element = await mountInbox();

    expect(all(element, '[part="group"]').map(node => node.getAttribute("data-group-key"))).toEqual([
      "approval",
      "sla-breach",
      "mention",
    ]);
    expect(q(element, '[part="unread-pill"]')?.textContent).toBe("3 unread");
  });

  it("orders unread ahead of read inside a section", async () => {
    const element = await mountInbox();

    const approvals = all(element, '[part="group"]')[0]!;
    const ids = Array.from(approvals.querySelectorAll('[part="item"]')).map(node =>
      node.getAttribute("data-item-id"),
    );
    // n3 is the newest approval but has been read, so it trails the unread ones.
    expect(ids).toEqual(["n2", "n1", "n3"]);
  });

  it("filters to unread and drops emptied sections", async () => {
    const element = await mountInbox();
    const changed = vi.fn();
    element.addEventListener("filter-changed", changed);

    all(element, '[part="filter"]')[1]!.click();
    await flush();

    expect(element.filter).toBe("unread");
    expect(all(element, '[part="group"]').map(n => n.getAttribute("data-group-key"))).toEqual([
      "approval",
      "sla-breach",
    ]);
    expect(element.visibleNotifications.every(item => !item.read)).toBe(true);
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ detail: { filter: "unread" } }));
  });

  it("emits mark-read and dismiss as intents without mutating its own list", async () => {
    const element = await mountInbox();
    const markRead = vi.fn();
    const dismissed = vi.fn();
    element.addEventListener("mark-read-requested", markRead);
    element.addEventListener("dismiss-requested", dismissed);

    const readButton = all(element, '[part="item-action"]').find(
      node => node.getAttribute("data-action") === "read",
    )!;
    readButton.click();
    await flush();

    expect(markRead.mock.calls[0]?.[0].detail.item.id).toBe("n2");
    // The host owns the write: the element must not decide it has been read.
    expect(element.notifications.find(item => item.id === "n2")?.read).toBeUndefined();
    expect(element.unreadCount).toBe(3);

    all(element, '[part="item-action"]')
      .find(node => node.getAttribute("data-action") === "dismiss")!
      .click();
    await flush();
    expect(dismissed).toHaveBeenCalled();
    expect(element.notifications).toHaveLength(items.length);
  });

  it("offers Mark read only on unread rows", async () => {
    const element = await mountInbox();

    const readRow = all(element, '[part="item"]').find(
      node => node.getAttribute("data-item-id") === "n3",
    )!;
    const actions = Array.from(readRow.querySelectorAll('[part="item-action"]')).map(node =>
      node.getAttribute("data-action"),
    );
    expect(actions).toEqual(["dismiss"]);
  });

  it("requests a bulk mark-all with only the unread records", async () => {
    const element = await mountInbox();
    const markAll = vi.fn();
    element.addEventListener("mark-all-read-requested", markAll);

    (q(element, '[part="mark-all"]') as HTMLButtonElement).click();
    await flush();

    expect(markAll.mock.calls[0]?.[0].detail.items.map((item: NotificationItem) => item.id)).toEqual(
      ["n1", "n2", "n4"],
    );
  });

  it("disables mark-all when nothing is unread", async () => {
    const element = await mountInbox(el => (el.notifications = items.filter(item => item.read)));
    const markAll = vi.fn();
    element.addEventListener("mark-all-read-requested", markAll);

    const button = q(element, '[part="mark-all"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.click();
    await flush();
    expect(markAll).not.toHaveBeenCalled();
  });

  it("emits notification-selected when a row title is activated", async () => {
    const element = await mountInbox();
    const selected = vi.fn();
    element.addEventListener("notification-selected", selected);

    all(element, '[part="item-title"]')[0]!.click();

    expect(selected.mock.calls[0]?.[0].detail.item.id).toBe("n2");
  });

  it("downgrades an unsafe entity href to plain text", async () => {
    const element = await mountInbox(el => {
      el.notifications = [
        {
          id: "u1",
          title: "Hostile link",
          type: "approval",
          entityRef: { id: "e", label: "Report", href: "//evil.example/x" },
        },
      ];
    });

    const entity = q(element, '[part="entity"]')!;
    expect(entity.tagName).toBe("SPAN");
    expect(entity.hasAttribute("href")).toBe(false);
  });

  it("keeps a safe entity href as a link", async () => {
    const element = await mountInbox();
    const entity = all(element, '[part="entity"]').find(node => node.tagName === "A");
    expect(entity?.getAttribute("href")).toBe("/contracts/acme");
  });

  it("shows a filter-aware empty state", async () => {
    const element = await mountInbox(el => (el.notifications = []));
    expect(q(element, '[part="empty"]')?.textContent).toBe("You're all caught up.");

    const withOnlyRead = await mountInbox(el => {
      el.notifications = items.filter(item => item.read);
      el.filter = "unread";
    });
    expect(q(withOnlyRead, '[part="empty"]')?.textContent).toBe("No unread notifications.");
  });

  it("uses supplied type labels for section headings", async () => {
    const element = await mountInbox(el => {
      el.typeLabels = { "sla-breach": "SLA breaches", approval: "Approvals" };
    });

    expect(all(element, '[part="group-label"]').map(node => node.textContent?.trim().split("\n")[0]?.trim())).toEqual([
      "Approvals",
      "SLA breaches",
      "Mention",
    ]);
  });

  it("escapes hostile content in every rendered field", async () => {
    const element = await mountInbox(el => {
      el.notifications = [
        {
          id: "<img src=x onerror=alert(1)>",
          title: "<script>alert('title')</script>",
          type: "<i>type</i>",
          summary: "<b>summary</b>",
          actor: { name: "<u>actor</u>" },
          entityRef: { id: "e", label: "<s>entity</s>" },
        },
      ];
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("b")).toBeNull();
    expect(q(element, '[part="item-title"]')?.textContent).toBe("<script>alert('title')</script>");
    expect(q(element, '[part="summary"]')?.textContent).toBe("<b>summary</b>");
    expect(q(element, '[part="actor"]')?.textContent).toBe("<u>actor</u>");
    expect(q(element, '[part="entity"]')?.textContent).toBe("<s>entity</s>");
  });

  it("ignores a malformed payload rather than rendering a partial list", async () => {
    const element = document.createElement("box-notification-inbox") as NotificationInbox;
    element.setAttribute(
      "notifications",
      '[{"id":"ok","title":"Fine","type":"approval"},{"title":"no id"}]',
    );
    document.body.append(element);
    await flush();

    expect(element.notifications).toEqual([]);
    expect(q(element, '[part="empty"]')?.hidden).toBe(false);
  });

  it("restores focus to the equivalent control after a rebuild", async () => {
    const element = await mountInbox();

    const action = all(element, '[part="item-action"]').find(
      node =>
        node.getAttribute("data-item-id") === "n1" && node.getAttribute("data-action") === "dismiss",
    )!;
    action.focus();
    expect(element.shadowRoot!.activeElement).toBe(action);

    // The host marks something else read; the list re-renders.
    element.notifications = items.map(item =>
      item.id === "n4" ? { ...item, read: true } : item,
    );
    await flush();

    const restored = element.shadowRoot!.activeElement as HTMLElement | null;
    expect(restored?.getAttribute("data-item-id")).toBe("n1");
    expect(restored?.getAttribute("data-action")).toBe("dismiss");
    expect(restored).not.toBe(action);
  });
});
