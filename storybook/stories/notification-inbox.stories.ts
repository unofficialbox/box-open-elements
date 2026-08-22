import type { StoryModule } from "../metadata.js";

const notificationInbox: StoryModule = {
  title: "Patterns/Notifications/Notification Inbox",
  meta: {
    id: "notification-inbox",
    tag: "box-notification-inbox",
    shortDescription: "Grouped triage panel for approvals waiting, SLA breaches, and mentions.",
    docsDescription:
      "Toasts are transient and unordered, which is the wrong shape for work you have to come back to; this is the list you triage from. Sections group by an open `type` vocabulary and lead with the most unread, then the most items, then label — so what needs attention rises and the order never depends on input order. Inside a section unread lead read and then run newest first, with undated records sinking rather than being dropped. The load-bearing decision is that mutations are intents, never local state changes: the element never marks anything read on its own, so the host owns the write and feeds back a new list, and the inbox can never disagree with the server about what has been seen. Mark read is offered only on rows that are actually unread, bulk mark-all carries only the unread records, unsafe entity hrefs downgrade to plain text, and focus is sampled and restored across rebuilds so acting on a row does not drop the reader to the top.",
    sourceSnippet: `<box-notification-inbox heading="Notifications"></box-notification-inbox>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "filter", type: '"all" | "unread"', description: "Which records are shown." },
      { kind: "attribute", name: "notifications", type: "json", description: "NotificationItem records, validated per record." },
      { kind: "attribute", name: "type-labels", type: "json", description: "`{ type: heading }` overrides; unmapped types are humanized." },
      { kind: "property", name: "unreadCount", type: "number", description: "Unread total across all records." },
      { kind: "property", name: "visibleNotifications", type: "NotificationItem[]", description: "Records on screen after the filter." },
      { kind: "event", name: "notification-selected", description: "A row title was activated." },
      { kind: "event", name: "mark-read-requested", description: "Intent — the host performs the write." },
      { kind: "event", name: "mark-all-read-requested", description: "Intent carrying only the unread records." },
      { kind: "event", name: "dismiss-requested", description: "Intent — the host removes the record." },
      { kind: "event", name: "filter-changed", description: "All/Unread was switched." },
    ],
  },
  variants: [
    {
      name: "Grouped triage queue",
      html: `<box-notification-inbox heading="Notifications"></box-notification-inbox>`,
      note: "Approvals lead because they hold the most unread. Mark read and Dismiss emit intents; the docs-site demo plays the host so they take effect.",
    },
    {
      name: "Unread only",
      html: `<box-notification-inbox heading="Notifications" filter="unread"></box-notification-inbox>`,
      note: "Sections emptied by the filter disappear rather than rendering as zero-count headings.",
    },
  ],
};

export default notificationInbox;
