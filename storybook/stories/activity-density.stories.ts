import type { StoryModule } from "../metadata.js";

const activityDensity: StoryModule = {
  title: "Patterns/Audit/Activity Density",
  meta: {
    id: "activity-density",
    tag: "box-activity-density",
    shortDescription: "Calendar heatmap of audit volume per UTC day, for spotting throughput at a glance.",
    docsDescription:
      "The managerial companion to box-audit-log, over the same records. The window is whole week columns ending on the reference day, rows Sunday → Saturday, with levels scaled against the busiest day in the window. Days with activity are buttons in a roving-tabindex grid — arrows move by day and by week, Home/End jump to the ends of the window by date rather than by DOM order — and each button's accessible name carries its own count and date, since colour alone carries no meaning. Quiet days are inert cells, so tab stops stay proportional to real activity. Selecting a day emits day-selected with that day's events: the drill-down into the log.",
    sourceSnippet: `<box-activity-density heading="Activity density" weeks="8"></box-activity-density>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "events", type: "json", description: "AuditEvent records, validated per record." },
      { kind: "attribute", name: "weeks", type: "number", description: "Week columns in the trailing window; clamped to 1–53, defaults to 12." },
      { kind: "attribute", name: "reference-time", type: "string", description: "The day the window ends on — pin it for deterministic rendering." },
      { kind: "property", name: "density", type: "ActivityDensity", description: "The computed window: cells, totals, and the busiest day's count." },
      { kind: "property", name: "eventsOn", type: "(date: string) => AuditEvent[]", description: "Every event on the given UTC day." },
      { kind: "event", name: "day-selected", description: "A day with activity was activated — detail carries the date, count, and events." },
    ],
  },
  variants: [
    {
      name: "Eight-week window",
      html: `<box-activity-density heading="Activity density" weeks="8"></box-activity-density>`,
      note: "Levels scale against the busiest day, so the strip reads the same whether the period saw ten events or ten thousand.",
    },
  ],
};

export default activityDensity;
