import type { StoryModule } from "../metadata.js";

const wizardSummary: StoryModule = {
  title: "Patterns/Form Wizard/Wizard Summary",
  meta: {
    id: "wizard-summary",
    tag: "box-wizard-summary",
    shortDescription: "The wizard's review step: collected values grouped by the step that collected them.",
    docsDescription:
      "The review step of `box-form-wizard`. It shows everything the wizard has collected, grouped by the step that collected it, with a per-step Edit control. The card is read-only and emits `edit-requested` rather than navigating itself, so the host stays in charge of the wizard — the same intent contract the other patterns use, and `summarizeWizardValues` / `formatWizardValue` are pure, so a host can drive its own review surface from the same functions. Two decisions carry the weight. Sections follow **step order** rather than the order the fields were declared, so the summary reads back in the sequence the user filled it in. And a field naming a step that does not exist lands in a trailing section instead of being dropped: a review card exists so someone can confirm what they are about to submit, and a mistyped `stepId` silently hiding an answer would let them confirm a value they never saw — a visibly odd extra section is a bug someone reports, a missing row is a bug nobody notices. Smaller details follow the same logic: `false` renders as 'No' rather than a blank, because a negative answer is an answer and must not read as unanswered; an uncollected field renders a placeholder rather than an empty line; and each Edit control is named for its step, since five buttons all called 'Edit' tell a screen-reader user nothing about which one goes where.",
    sourceSnippet: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
    referenceRows: [
      { kind: "attribute", name: "fields", type: "json", description: "WizardSummaryField records: `key`, `label`, `stepId`, and an optional `format`. Set as a property when a field needs `format` — a function cannot survive a JSON attribute." },
      { kind: "attribute", name: "steps", type: "json", description: "The wizard's WizardStepConfig list; supplies section order and labels." },
      { kind: "attribute", name: "values", type: "json", description: "The wizard's collected value store." },
      { kind: "attribute", name: "heading", type: "string", description: "Card title and its accessible name. Defaults to 'Review your answers'." },
      { kind: "attribute", name: "edit-label", type: "string", description: "Verb on the per-section control; the step label is appended for its accessible name. Defaults to 'Edit'." },
      { kind: "attribute", name: "empty-text", type: "string", description: "Placeholder for a field with nothing collected. Defaults to 'Not provided'." },
      { kind: "property", name: "sections", type: "WizardSummarySection[]", description: "Read-only: the sections as rendered, in the same order." },
      { kind: "event", name: "edit-requested", description: "An Edit control was activated — detail carries `stepId`." },
    ],
  },
  variants: [
    {
      name: "Collected answers",
      html: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
      note: "Sections follow step order regardless of how the field list is written. Auto-renew reads 'No'; an unfilled field shows its placeholder.",
    },
    {
      name: "Nothing collected yet",
      html: `<box-wizard-summary heading="Review your answers"></box-wizard-summary>`,
      note: "Every row still appears with a placeholder. Hiding unanswered questions would hide exactly what the reader needs to notice.",
    },
  ],
};

export default wizardSummary;
