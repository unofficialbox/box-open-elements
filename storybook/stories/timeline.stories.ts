import type { StoryModule } from "../metadata.js";

const timeline: StoryModule = {
  title: "Patterns/Timeline/Timeline",
  meta: {
    id: "timeline",
    tag: "box-timeline",
    shortDescription: "Append-only activity feed with tone markers, evidence chips, and an optional composer.",
    docsDescription:
      "The activity spine the approvals history, audit trail, and sidebar activity tab all need: validated events render actor, action, badge, summary, and timestamps with tone markers; evidence chips emit evidence-selected (unsafe hrefs downgrade from links to buttons); has-more drives a load-more paging contract; and the composable flag adds an entry composer emitting entry-submitted.",
    sourceSnippet: `<box-timeline heading="Contract activity" composable has-more></box-timeline>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "events", type: "json", description: "TimelineEvent records; each is validated before rendering." },
      { kind: "attribute", name: "composable", type: "boolean", description: "Shows the entry composer." },
      { kind: "attribute", name: "has-more", type: "boolean", description: "Shows the Load more affordance." },
      { kind: "property", name: "events", type: "TimelineEvent[]", description: "Property form of the event list." },
      { kind: "event", name: "evidence-selected", description: "An evidence chip was activated." },
      { kind: "event", name: "load-more", description: "The paging affordance was activated." },
      { kind: "event", name: "entry-submitted", description: "The composer submitted a new entry body." },
    ],
  },
  variants: [
    {
      name: "Contract activity",
      html: `<box-timeline heading="Contract activity" composable has-more></box-timeline>`,
      note: "Execution, approval, and policy-flag events with success/brand/warning tones and evidence chips.",
    },
  ],
};

export default timeline;
