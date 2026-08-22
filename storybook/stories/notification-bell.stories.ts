import type { StoryModule } from "../metadata.js";

const notificationBell: StoryModule = {
  title: "Patterns/Notifications/Notification Bell",
  meta: {
    id: "notification-bell",
    tag: "box-notification-bell",
    shortDescription: "Unread count trigger for the app chrome, with the count in its accessible name.",
    docsDescription:
      "The bell that opens the inbox. The unread count is the accessible name — 'Notifications, 3 unread' — not merely a red badge, because colour and a dot alone tell a screen-reader user nothing. Past `max` the badge abbreviates to '9+' while the label keeps the true number: the abbreviation is a layout concession, the number is the fact, and assistive tech should never be told '9+' when it is 240. The count derives from `notifications` when records are supplied, or from a bare `unread-count` when the host keeps the list server-side, so the same element works in both architectures.",
    sourceSnippet: `<box-notification-bell label="Notifications"></box-notification-bell>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Base accessible name; the unread count is appended." },
      { kind: "attribute", name: "max", type: "number", description: "Largest number rendered before the badge abbreviates. Defaults to 99." },
      { kind: "attribute", name: "expanded", type: "boolean", description: "Reflects the inbox's open state onto `aria-expanded`." },
      { kind: "attribute", name: "unread-count", type: "number", description: "Count when the host keeps the list server-side; ignored if `notifications` is set." },
      { kind: "attribute", name: "notifications", type: "json", description: "NotificationItem records; the count derives from them." },
      { kind: "event", name: "toggle", description: "The trigger was activated — detail carries `expanded` and `unreadCount`." },
    ],
  },
  variants: [
    {
      name: "With unread notifications",
      html: `<box-notification-bell label="Notifications"></box-notification-bell>`,
      note: "Three unread. Inspect the trigger's aria-label — the count is in the accessible name, not only the badge.",
    },
  ],
};

export default notificationBell;
