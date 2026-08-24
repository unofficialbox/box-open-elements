import type { StoryModule } from "../metadata.js";

const progressSteps: StoryModule = {
  title: "Components/Feedback/Progress Steps",
  meta: {
    id: "progress-steps",
    tag: "box-progress-steps",
    shortDescription: "A stepped progress indicator.",
    docsDescription:
      "The vertical setup rail for a multi-step flow — for a horizontal record-lifecycle tracker use `box-path`, and for a machine run with failures use `box-run-trace`. Steps derive complete/current/upcoming from their position relative to `value`; an optional per-item `status` (**complete, blocked, failed, disabled**) wins over the derivation, so out-of-order completion and stuck steps are expressible. Currency and condition are stated separately — a failed step can be the current one and stays clickable, while blocked and disabled steps are real disabled buttons that keyboard navigation skips. Every state is stated in words (blocked/failed/disabled visibly, with an optional `statusNote`; the positional states as screen-reader text), and a polite live region announces user-driven step changes. `resolveStepStates` is pure, so a host can decide whether Continue is enabled from the same rules the rail renders.",
    sourceSnippet: `<box-progress-steps label="Migration" items='[{"label":"Scan","value":"scan"}]' value="scan"></box-progress-steps>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible steps label." },
      { kind: "attribute", name: "items", type: "json", description: "Array of { label, value, description?, status?, statusNote? }; status is complete | blocked | failed | disabled." },
      { kind: "attribute", name: "value", type: "string", description: "Active step value (controlled)." },
      { kind: "property", name: "resolvedSteps", type: "ResolvedProgressStep[]", description: "Read-only: per-step state, currency, and interactivity — same objects the render uses." },
      { kind: "event", name: "value-changed", type: "CustomEvent", description: "A step was selected — detail { value }." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-progress-steps label="Migration" items='[{"label":"Scan","value":"scan"},{"label":"Copy","value":"copy","description":"In progress"},{"label":"Verify","value":"verify"}]' value="copy"></box-progress-steps>`,
    },
    {
      name: "With statuses",
      html: `<box-progress-steps label="Workspace setup" items='[{"label":"Connect account","value":"connect","status":"complete"},{"label":"Configure sync","value":"configure","status":"failed","statusNote":"Credentials were rejected"},{"label":"Choose folders","value":"choose"},{"label":"Invite team","value":"invite","status":"blocked","statusNote":"Fix configuration first"},{"label":"Archive import","value":"archive","status":"disabled"}]' value="choose"></box-progress-steps>`,
      note: "Failed stays clickable — it is where the user needs to go. Blocked and disabled are real disabled buttons, skipped by arrow keys, with their condition stated in words.",
    },
  ],
};

export default progressSteps;
