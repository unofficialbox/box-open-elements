import type { StoryModule } from "../metadata.js";

const auditLog: StoryModule = {
  title: "Patterns/Audit/Audit Log",
  meta: {
    id: "audit-log",
    tag: "box-audit-log",
    shortDescription:
      "Grouped, faceted, exportable audit trail over the timeline event contract.",
    docsDescription:
      "box-timeline is the flat feed; this is the aggregation layer over the same records — AuditEvent *is* TimelineEvent, so one source feeds both without a second model. Sections group by day, actor, or action, with counts and actor tallies; days run newest-first with a trailing undated section, while actor and action sections run by count with label tie-breaks so order never depends on input order. Facet options are derived from the unfiltered set, so choosing one facet can never empty another's list. A correlation id drills down to a single workflow run, and Export CSV emits exactly what the filters left on screen — an export that silently widens past the reader's filters is a compliance hazard. Day keys, day labels, and row timestamps are all resolved in UTC, so a row can never appear outside the day section holding it. Aggregation is client-side; server-side paging and row virtualization are tracked limitations.",
    sourceSnippet: `<box-audit-log heading="Audit log" group-by="day" exportable></box-audit-log>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "group-by", type: '"day" | "actor" | "action"', description: "Section dimension. Changing it clears the collapse state, since keys belong to a dimension." },
      { kind: "attribute", name: "events", type: "json", description: "AuditEvent records, validated per record." },
      { kind: "attribute", name: "facet-actor", type: "string", description: "Exact actor-name match; empty means unselected." },
      { kind: "attribute", name: "facet-action", type: "string", description: "Exact action match." },
      { kind: "attribute", name: "facet-correlation-id", type: "string", description: "Workflow-run drill-down." },
      { kind: "attribute", name: "facet-from", type: "string", description: "Inclusive lower bound; a date-only value covers the whole UTC day." },
      { kind: "attribute", name: "facet-to", type: "string", description: "Inclusive upper bound; a date-only value covers the whole UTC day." },
      { kind: "attribute", name: "exportable", type: "boolean", description: "Renders the Export CSV button." },
      { kind: "attribute", name: "reference-time", type: "string", description: "Pins Today/Yesterday labels for deterministic rendering." },
      { kind: "property", name: "visibleEvents", type: "AuditEvent[]", description: "The full set narrowed by the current facets." },
      { kind: "event", name: "event-selected", description: "An audit row was activated." },
      { kind: "event", name: "evidence-selected", description: "An evidence chip was activated; unsafe hrefs render as buttons." },
      { kind: "event", name: "correlation-selected", description: "A correlation id was activated — detail carries that run's events." },
      { kind: "event", name: "export-requested", description: "Detail carries the CSV and the exported events; the host owns delivery." },
    ],
  },
  variants: [
    {
      name: "Grouped by day",
      html: `<box-audit-log heading="Audit log" group-by="day" exportable></box-audit-log>`,
      note: "Newest day first with counts and actor tallies. Collapsing a section is a state flip, not a rebuild, so scroll position and focus survive.",
    },
    {
      name: "Grouped by actor",
      html: `<box-audit-log heading="Audit log" group-by="actor" exportable></box-audit-log>`,
      note: "Sections by descending event count, ties broken by label; unattributed events land in a trailing section.",
    },
    {
      name: "Drilled down to one workflow run",
      html: `<box-audit-log heading="Audit log" group-by="day" facet-correlation-id="wf-9042" exportable></box-audit-log>`,
      note: "The correlation drill-down with its clear affordance. Export CSV now emits only these three rows.",
    },
  ],
};

export default auditLog;
