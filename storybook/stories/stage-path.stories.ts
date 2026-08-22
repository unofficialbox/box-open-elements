import type { StoryModule } from "../metadata.js";

const stagePath: StoryModule = {
  title: "Components/Feedback/Stage Path",
  meta: {
    id: "stage-path",
    tag: "box-stage-path",
    shortDescription: "Horizontal chevron lifecycle tracker for a record header.",
    docsDescription:
      "The tracker every record header wants: Draft → In Review → Approved → Executed. Distinct from `box-progress-steps`, which is a vertical setup rail for a task the reader is working through — this states where a *record* sits, is read-only, and lives in a header. It renders as an ordered list with the current stage marked `aria-current=\"step\"` and completed stages carrying a ✓, so the sequence and the position are both available without relying on the chevron geometry, which is decoration and collapses on narrow viewports. An unknown `current` id leaves every stage upcoming rather than silently marking the path done, because a stale value from the host should read as *unknown*, not as *finished*. `resolveStageStates` is pure, so a host can compute the same states for its own chrome.",
    sourceSnippet: `<box-stage-path label="Contract lifecycle" current="in-review"></box-stage-path>`,
    referenceRows: [
      { kind: "attribute", name: "stages", type: "json", description: "StagePathStage records: `id`, `label`, and an optional `description` shown on the current stage." },
      { kind: "attribute", name: "current", type: "string", description: "Id of the stage the record is at. An unknown id leaves every stage upcoming." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the list. Defaults to 'Lifecycle'." },
      { kind: "property", name: "states", type: "StageState[]", description: "Read-only: 'complete' | 'current' | 'upcoming' for each stage, in order." },
    ],
  },
  variants: [
    {
      name: "Mid-lifecycle",
      html: `<box-stage-path label="Contract lifecycle" current="in-review"></box-stage-path>`,
      note: "Two stages complete, two upcoming. Only the current stage shows its description.",
    },
    {
      name: "Executed",
      html: `<box-stage-path label="Contract lifecycle" current="executed"></box-stage-path>`,
      note: "The terminal stage, with everything before it complete.",
    },
    {
      name: "Unknown stage",
      html: `<box-stage-path label="Contract lifecycle" current="withdrawn"></box-stage-path>`,
      note: "A `current` id that is not in the list leaves every stage upcoming rather than marking the path done.",
    },
  ],
};

export default stagePath;
