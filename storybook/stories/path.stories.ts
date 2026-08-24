import type { StoryModule } from "../metadata.js";

const path: StoryModule = {
  title: "Components/Feedback/Path",
  meta: {
    id: "path",
    tag: "box-path",
    shortDescription: "Horizontal lifecycle tracker for a record header.",
    docsDescription:
      "The tracker every record header wants: Draft → In Review → Approved → Executed. Distinct from `box-progress-steps`, which is a vertical setup rail for a task the reader is working through — this states where a *record* sits, is read-only, and lives in a header. It renders as an ordered list with the current stage marked `aria-current=\"step\"`, a visually hidden state word on every stage, and a ✓ on completed ones, so the sequence, the position and each state are all available without relying on the chevron geometry, which is decoration and collapses on narrow viewports. Two shapes are available: `chevron` (default) is a ribbon carrying each label inside the fill; `base` is a marker rail with labels beneath, which keeps a long sequence readable where chevrons would crush the text. A stage's `description` renders in the `base` rail only — a chevron is too narrow to carry one without wrapping to a second line and taking the whole row with it, which is why Salesforce's path type shows labels alone. It stays in the DOM, so a host with the width can re-show it via `::part(stage-description)`. `has-error` reports a failure at the stage the record stopped on — stages behind it stay complete, because the work up to the failure did happen. An unknown `current` id leaves every stage upcoming rather than silently marking the path done, because a stale value from the host should read as *unknown*, not as *finished*. `resolveStageStates` is pure, so a host can compute the same states for its own chrome.",
    sourceSnippet: `<box-path label="Contract lifecycle" current="in-review"></box-path>`,
    referenceRows: [
      { kind: "attribute", name: "stages", type: "json", description: "PathStage records: `id`, `label`, and an optional `description` shown on the current stage in the `base` variant." },
      { kind: "attribute", name: "current", type: "string", description: "Id of the stage the record is at. An unknown id leaves every stage upcoming." },
      { kind: "attribute", name: "variant", type: "'chevron' | 'base'", description: "Shape of the path. `chevron` carries the label in the fill; `base` is a marker rail with labels beneath. Defaults to `chevron`; an unknown value falls back to it." },
      { kind: "attribute", name: "has-error", type: "boolean", description: "The record failed at the stage it is currently on. Earlier stages stay complete." },
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the list. Defaults to 'Lifecycle'." },
      { kind: "property", name: "states", type: "StageState[]", description: "Read-only: 'complete' | 'current' | 'upcoming' | 'error' for each stage, in order." },
    ],
  },
  variants: [
    {
      name: "Mid-lifecycle",
      html: `<box-path label="Contract lifecycle" current="in-review"></box-path>`,
      note: "One stage complete, two upcoming. Labels only: the chevron leaves the description to the base rail.",
    },
    {
      name: "Base rail",
      html: `<box-path variant="base" label="Contract lifecycle" current="in-review"></box-path>`,
      note: "A marker per stage on a connector line, label beneath. Every marker occupies the same box whatever its state, so the connector meets all of them on one line even when the current stage carries a description.",
    },
    {
      name: "Failed at the current stage",
      html: `<box-path variant="base" has-error label="Contract lifecycle" current="in-review"></box-path>`,
      note: "`has-error` fails the stage the record stopped on. The incoming connector stays brand-coloured — the record did travel that far — and the stage keeps `aria-current` while gaining `aria-invalid`.",
    },
    {
      name: "Executed",
      html: `<box-path label="Contract lifecycle" current="executed"></box-path>`,
      note: "The terminal stage, with everything before it complete.",
    },
    {
      name: "Unknown stage",
      html: `<box-path label="Contract lifecycle" current="withdrawn"></box-path>`,
      note: "A `current` id that is not in the list leaves every stage upcoming rather than marking the path done.",
    },
  ],
};

export default path;
