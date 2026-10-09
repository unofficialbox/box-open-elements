import type { StoryModule } from "../metadata.js";

const formWizard: StoryModule = {
  title: "Patterns/Form Wizard/Form Wizard",
  meta: {
    id: "form-wizard",
    tag: "box-form-wizard",
    shortDescription: "Multi-step form shell with validation-gated navigation over a headless step controller.",
    docsDescription:
      "FormWizardController owns the sequence, value store, and validation gates: Next and forward jumps validate, visited steps allow free back-navigation, optional steps skip, Save draft never validates, and Submit re-validates required steps. The shell uses a vertical rail by default or steps-layout=path for a full-width chevron path; phones use the compact step row. Both layouts navigate through the same controller. A step's id doubles as its panel slot name.",
    sourceSnippet: `<box-form-wizard heading="Contract intake" submit-label="Submit request">
  <div slot="parties">…</div>
  <div slot="terms">…</div>
  <div slot="review">…</div>
</box-form-wizard>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "steps", type: "json", description: "Step configs (id, label, description, optional). A step's id doubles as its slot name." },
      { kind: "attribute", name: "steps-layout", type: "rail | path", description: "Vertical rail (default) or chevron path above the full-width panel; the path becomes a compact step row on phones." },
      { kind: "attribute", name: "draft-label", type: "string", description: "Save-draft button label." },
      { kind: "attribute", name: "submit-label", type: "string", description: "Final-step submit label." },
      { kind: "property", name: "steps", type: "WizardStepConfig[]", description: "Property form of the step configs." },
      { kind: "property", name: "stepStatuses", type: "Record<string, WizardStepStatus>", description: "Optional per-step complete, visited, or failed display overrides; navigation still validates." },
      { kind: "property", name: "wizardController", type: "FormWizardController", description: "The live session; assign to share or configure validators." },
      { kind: "event", name: "step-changed", description: "Active step moved (Next, Back, rail, or path jump)." },
      { kind: "event", name: "step-invalid", description: "A gated step blocked forward navigation." },
      { kind: "event", name: "draft-saved", description: "Save draft pressed; detail carries the value store." },
      { kind: "event", name: "submitted", description: "All gated steps passed; detail carries the values." },
    ],
  },
  variants: [
    {
      name: "Contract intake",
      html: `<box-form-wizard heading="Contract intake" submit-label="Submit request">
  <div slot="parties">Party fields…</div>
  <div slot="terms">Key-term fields…</div>
  <div slot="review">Review summary…</div>
</box-form-wizard>`,
      note: "Three steps with the review step gated by the earlier validators; the rail marks visited steps navigable.",
    },
  ],
};

export default formWizard;
