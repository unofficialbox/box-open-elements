import type { StoryModule } from "../metadata.js";

const dueBadge: StoryModule = {
  title: "Components/Feedback/Due Badge",
  meta: {
    id: "due-badge",
    tag: "box-due-badge",
    shortDescription: "SLA and aging urgency for a due date, stated in days.",
    docsDescription:
      "The badge that answers *how late is this?* — so aging is stated in days (\"Overdue by 3 days\", \"Due tomorrow\") rather than as a bare date, because a reader should not have to subtract today from a timestamp to learn a review has slipped. Day distances are measured between UTC day boundaries rather than by elapsed milliseconds, so \"tomorrow\" is 1 whether it is 23 hours away or 25. Only the overdue and due-today buckets carry status colour; the rest stay neutral, so the urgent ones are the ones that shout. `reference-time` pins the clock for deterministic previews and screenshots; omit it and the badge uses now. `resolveDueBucket`, `daysUntilDue`, and `formatDueLabel` are pure and shared with the work-queue pattern, so a table and a badge can never disagree about what counts as overdue.",
    sourceSnippet: `<box-due-badge due-at="2026-08-20T17:00:00.000Z"></box-due-badge>`,
    referenceRows: [
      { kind: "attribute", name: "due-at", type: "string", description: "ISO timestamp the badge describes. Absent renders the no-due-date state." },
      { kind: "attribute", name: "label", type: "string", description: "Overrides the derived phrasing while keeping the bucket's colour." },
      { kind: "attribute", name: "compact", type: "boolean", description: "Denser presentation for table cells; the full phrasing stays available to assistive tech." },
      { kind: "attribute", name: "reference-time", type: "string", description: "ISO timestamp used as 'now'. Pins the badge for deterministic rendering." },
      { kind: "property", name: "bucket", type: "DueBucket", description: "Read-only: 'overdue' | 'today' | 'this-week' | 'later' | 'none'." },
      { kind: "property", name: "resolvedLabel", type: "string", description: "Read-only: the phrasing actually rendered." },
    ],
  },
  variants: [
    {
      name: "Every bucket",
      html: `<box-due-badge due-at="2026-08-10T17:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>
<box-due-badge due-at="2026-08-13T17:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>
<box-due-badge due-at="2026-08-14T09:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>
<box-due-badge due-at="2026-08-18T09:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>
<box-due-badge due-at="2026-09-04T09:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>
<box-due-badge reference-time="2026-08-13T12:00:00.000Z"></box-due-badge>`,
      note: "Overdue, today, tomorrow, this week, later, and no due date — all against the same pinned reference time.",
    },
    {
      name: "Compact",
      html: `<box-due-badge due-at="2026-08-10T17:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z" compact></box-due-badge>
<box-due-badge due-at="2026-08-18T09:00:00.000Z" reference-time="2026-08-13T12:00:00.000Z" compact></box-due-badge>`,
      note: "For dense table cells, where the surrounding row already says what the date is about.",
    },
  ],
};

export default dueBadge;
