import type { StoryModule } from "../metadata.js";

const indicator: StoryModule = {
  title: "Components/Feedback/Indicator",
  meta: {
    id: "indicator",
    tag: "box-indicator",
    shortDescription: "A status mark for dense lists.",
    docsDescription:
      "Distinct in **shape** as well as colour. A column of coloured dots is unreadable to anyone who cannot separate the colours, and status is exactly the information a reader most needs from a dense list — so the shape carries the meaning and colour is the redundant channel rather than the only one. That is the same rule the `box-alert` and `box-toast` glyphs follow. When there is no visible `label`, the tone is still stated for assistive technology, because a bare dot otherwise announces nothing at all; when a label *is* present the tone stays quiet, so a reader does not hear \"Success Signed\" where the screen says \"Signed\". Reach for `box-badge` where the status needs a filled pill, and this where a status column has to stay narrow.",
    sourceSnippet: `<box-indicator tone="success" label="Signed"></box-indicator>`,
    referenceRows: [
      { kind: "attribute", name: "tone", type: "string", description: "`info` (default), `success`, `warning`, `error` or `pending`. Unknown tones render the neutral disc." },
      { kind: "attribute", name: "label", type: "string", description: "Visible text beside the mark. Optional; without it the tone is announced instead." },
      { kind: "part", name: "shape", type: "part", description: "The mark. `aria-hidden`, since the label or tone-label carries the meaning." },
      { kind: "part", name: "label", type: "part", description: "The visible text." },
    ],
  },
  variants: [
    { name: "Status column", html: `<div style="display:grid;gap:0.4rem"><box-indicator tone="success" label="Signed"></box-indicator><box-indicator tone="warning" label="Awaiting counter-signature"></box-indicator><box-indicator tone="error" label="Rejected"></box-indicator><box-indicator tone="pending" label="Not started"></box-indicator></div>`, note: "Disc, triangle, diamond and ring — legible in greyscale, which is the test that matters." },
    { name: "Bare", html: `<div style="display:flex;gap:0.6rem"><box-indicator tone="success"></box-indicator><box-indicator tone="warning"></box-indicator><box-indicator tone="error"></box-indicator></div>`, note: "Without a label each mark still announces its tone to a screen reader." },
    { name: "Info", html: `<box-indicator tone="info" label="Draft"></box-indicator>` },
  ],
};

export default indicator;
