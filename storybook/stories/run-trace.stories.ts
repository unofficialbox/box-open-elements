import type { StoryModule } from "../metadata.js";

const runTrace: StoryModule = {
  title: "Patterns/Runs/Run Trace",
  meta: {
    id: "run-trace",
    tag: "box-run-trace",
    shortDescription: "Machine execution trace: a job, pipeline, or agent run, top-down.",
    docsDescription:
      "The execution surface for a job, pipeline, or agent run — deliberately not `box-timeline`, which is the newest-first *human* activity feed with actors and comments. A run reads forward, has one step in flight, and takes no comments. `resolveRunSteps` is pure and DOM-free, so a host can drive notifications or a retry-from-here affordance from the same rules the surface renders. Three rules, in priority order: **an explicit status wins**; **a failure shadows the queue behind it** — later steps derive `skipped`, never `pending`, because a dead run must not show work as still coming (the same rule `resolveCeremony` applies after a decline), while an explicit later status still overrides the shadow so a cleanup hook that ran anyway can say so; **timestamps decide the rest** — `finishedAt` means succeeded, `startedAt` alone means running, neither means pending. Every status is stated in words, the summary chip is a polite `role=\"status\"` region so attribute-driven live updates announce themselves, and per-step detail expands in place: description, child tasks composing `box-progress-bar`, and a `detail-<id>` slot for logs or links. Expansion survives steps updates — a live run must not snap shut on every patch.",
    sourceSnippet: `<box-run-trace heading="Generate documents"></box-run-trace>`,
    referenceRows: [
      { kind: "attribute", name: "steps", type: "json", description: "Step records: `id`, `title`, optional `description`, `status`, `startedAt`, `finishedAt`, `children` (each `id`, `label`, optional `progress` 0–100, `status`)." },
      { kind: "attribute", name: "heading", type: "string", description: "Panel title and its accessible name. Defaults to 'Run'." },
      { kind: "property", name: "resolution", type: "RunResolution", description: "Read-only: resolved per-step statuses, overall run status, and settled counts — same object the render uses." },
      { kind: "property", name: "expandedSteps", type: "string[]", description: "Read-only: ids of the steps whose detail is currently expanded." },
      { kind: "event", name: "step-toggled", type: "{ stepId, expanded }", description: "A step's detail was expanded or collapsed." },
      { kind: "slot", name: "detail-<id>", type: "slot", description: "Rich host content (logs, links) projected into that step's expanded detail." },
    ],
  },
  variants: [
    {
      name: "Running, with child tasks",
      html: `<box-run-trace heading="Generate documents — MSA_Acme v4"></box-run-trace>`,
      note: "One step in flight; its per-template children report live progress.",
    },
    {
      name: "Failed",
      html: `<box-run-trace heading="Generate documents — MSA_Acme v4"></box-run-trace>`,
      note: "After the failure, routing is Skipped — never still queued. The summary names the failed step.",
    },
  ],
};

export default runTrace;
