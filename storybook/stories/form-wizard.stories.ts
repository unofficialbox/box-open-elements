import type { StoryModule } from "../metadata.js";

const formWizard: StoryModule = {
  title: "Patterns/Form Wizard/Form Wizard",
  meta: {
    id: "form-wizard",
    tag: "box-form-wizard",
    shortDescription: "Multi-step form shell with validation-gated navigation over a headless step controller.",
    docsDescription:
      "FormWizardController owns the step sequence, a value store, and per-step validation gating: Next and forward jumps run the step's validator, visited steps allow free back-navigation, optional steps skip, Save draft persists without validating, and Submit re-validates every gated step and jumps to the first failure. The shell composes a box-progress-steps rail with one slot per step — a step's id doubles as its slot name — so hosts bring their own form fields.",
    sourceSnippet: `<box-form-wizard heading="Contract intake" submit-label="Submit request">
  <div slot="parties">…</div>
  <div slot="terms">…</div>
  <div slot="review">…</div>
</box-form-wizard>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "steps", type: "json", description: "Step configs (id, label, description, optional). A step's id doubles as its slot name." },
      { kind: "attribute", name: "draft-label", type: "string", description: "Save-draft button label." },
      { kind: "attribute", name: "submit-label", type: "string", description: "Final-step submit label." },
      { kind: "property", name: "steps", type: "WizardStepConfig[]", description: "Property form of the step configs." },
      { kind: "property", name: "wizardController", type: "FormWizardController", description: "The live session; assign to share or configure validators." },
      { kind: "event", name: "step-changed", description: "Active step moved (Next, Back, or rail jump)." },
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
