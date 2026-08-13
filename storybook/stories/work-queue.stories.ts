import type { StoryModule } from "../metadata.js";

const workQueue: StoryModule = {
  title: "Patterns/Work Queue/Work Queue",
  meta: {
    id: "work-queue",
    tag: "box-work-queue",
    shortDescription: "Individual triage list grouped by urgency buckets over a shared queue session.",
    docsDescription:
      "The contract manager's 'what should I do next' view. WorkQueueController runs filtered, abort-superseded loads over a narrow WorkQueueTransport (loadItems plus optional claim/reassign/complete/escalate capabilities) with mutation-then-reload. Rows group by pure due buckets — Overdue → Due today → Due this week → Later — resolved against reference-time so renders are deterministic. Action buttons appear only for capabilities the transport provides; Reassign is intent-only for the host's confirm-before-apply flow.",
    sourceSnippet: `<box-work-queue heading="My work" token="…" assignee-id="morgan"></box-work-queue>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "token", type: "string", description: "Session token for the transport." },
      { kind: "attribute", name: "assignee-id", type: "string", description: "Current user; enables Claim on unassigned open items." },
      { kind: "attribute", name: "reference-time", type: "string", description: "ISO reference for the urgency buckets; defaults to now." },
      { kind: "property", name: "transport", type: "WorkQueueTransport", description: "Queue data + governed mutation capabilities." },
      { kind: "property", name: "queueController", type: "WorkQueueController", description: "Assign to share one session with a workload board." },
      { kind: "event", name: "item-selected", description: "A row title was activated." },
      { kind: "event", name: "reassign-requested", description: "Reassign intent — the host owns choosing the target person." },
      { kind: "event", name: "item-mutated", description: "A claim/complete/escalate succeeded (before reload)." },
      { kind: "event", name: "mutation-failed", description: "A mutation was refused by the transport." },
    ],
  },
  variants: [
    {
      name: "Triage list",
      html: `<box-work-queue heading="My work" token="…" assignee-id="morgan" reference-time="2026-08-13T12:00:00.000Z"></box-work-queue>`,
      note: "An overdue high-risk review, a due-today approval, and an unassigned signature offering Claim.",
    },
  ],
};

export default workQueue;
