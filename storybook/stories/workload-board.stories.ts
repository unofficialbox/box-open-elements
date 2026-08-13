import type { StoryModule } from "../metadata.js";

const workloadBoard: StoryModule = {
  title: "Patterns/Work Queue/Workload Board",
  meta: {
    id: "workload-board",
    tag: "box-workload-board",
    shortDescription: "Supervisor swimlanes over the same queue session — team workload or status pipeline.",
    docsDescription:
      "The supervisor projection of the work-queue session. Lanes by assignee show team workload: roster-ordered with visible spare capacity (zero-item members still get a lane), overdue counts, and wip-limit over-capacity flagging, under a summary strip of totals. Lanes by status render the pipeline/kanban view. Cards emit item-selected and reassign-requested; assign the same queueController as a box-work-queue to drive both projections from one session.",
    sourceSnippet: `<box-workload-board heading="Team workload" token="…" wip-limit="2"></box-workload-board>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "token", type: "string", description: "Session token for the transport." },
      { kind: "attribute", name: "lane-by", type: "string", description: "`assignee` (default) or `status` for the pipeline view." },
      { kind: "attribute", name: "wip-limit", type: "number", description: "Items-per-person threshold that flags a lane over capacity." },
      { kind: "attribute", name: "reference-time", type: "string", description: "ISO reference for overdue detection; defaults to now." },
      { kind: "property", name: "transport", type: "WorkQueueTransport", description: "Same contract as box-work-queue." },
      { kind: "property", name: "team", type: "WorkItemAssignee[]", description: "Roster that fixes lane order and shows spare capacity." },
      { kind: "property", name: "queueController", type: "WorkQueueController", description: "Assign to share the queue's session." },
      { kind: "event", name: "item-selected", description: "A card title was activated." },
      { kind: "event", name: "reassign-requested", description: "Card reassign intent for the host's confirm flow." },
    ],
  },
  variants: [
    {
      name: "Team workload",
      html: `<box-workload-board heading="Team workload" token="…" wip-limit="2" reference-time="2026-08-13T12:00:00.000Z"></box-workload-board>`,
      note: "Roster-ordered lanes with an over-capacity flag and a trailing unassigned lane.",
    },
  ],
};

export default workloadBoard;
