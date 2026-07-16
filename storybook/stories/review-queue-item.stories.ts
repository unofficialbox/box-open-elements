import type { StoryModule } from "../metadata.js";

const reviewQueueItem: StoryModule = {
  title: "Patterns/Task/Review Queue Item",
  meta: {
    id: "review-queue-item",
    tag: "box-review-queue-item",
    shortDescription: "A review-queue row with assignee and metrics.",
    docsDescription: "Combine heading/status attributes with JSON `assignee`, `metrics`, and `actions`.",
    sourceSnippet: `<box-review-queue-item heading="MSA_Acme_v4.pdf" item-label="Contract" status="Awaiting review" priority="Medium" due-date="Jul 14, 2026"></box-review-queue-item>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Item title." },
      { kind: "attribute", name: "item-label", type: "string", description: "Item type label." },
      { kind: "attribute", name: "status", type: "string", description: "Review status." },
      { kind: "attribute", name: "priority", type: "string", description: "Priority label." },
      { kind: "attribute", name: "due-date", type: "string", description: "Due date display." },
      { kind: "attribute", name: "assignee", type: "json", description: "Assignee summary." },
      { kind: "attribute", name: "metrics", type: "json", description: "Metric chips." },
      { kind: "attribute", name: "actions", type: "json", description: "Action buttons." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-review-queue-item heading="MSA_Acme_v4.pdf" item-label="Contract" status="Awaiting review" priority="Medium" due-date="Jul 14, 2026" message="Second-pass legal review." assignee='{"name":"Morgan Lee","role":"Legal"}' metrics='[{"label":"Pages","value":"34"},{"label":"Comments","value":"6"}]' actions='[{"id":"open","label":"Open"},{"id":"approve","label":"Approve","tone":"primary"}]'></box-review-queue-item>`,
    },
  ],
};

export default reviewQueueItem;
