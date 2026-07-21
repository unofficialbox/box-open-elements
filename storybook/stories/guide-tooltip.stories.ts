import type { StoryModule } from "../metadata.js";

const guideTooltip: StoryModule = {
  title: "Components/Overlays/Guide Tooltip",
  meta: {
    id: "guide-tooltip",
    tag: "box-guide-tooltip",
    shortDescription: "A guided-tour callout that walks through steps.",
    docsDescription:
      "A product-tour callout that points at a target and steps a user through a sequence. Anchor it with `for` (a target id) or a slotted `anchor` element (it self-anchors otherwise). It renders a `heading`, a body (default slot), a `step`/`total` indicator, and Back/Next/Close controls, emitting `next`, `back`, and `close` (each with `detail.step`) so the host advances the tour. Positioned as a viewport-fixed overlay via the shared `foundations/overlay` primitive, so it escapes ancestor overflow and flips/shifts to stay on-screen.",
    sourceSnippet: `<box-guide-tooltip heading="Upload files" step="2" total="4" open>Drag files here to add them.</box-guide-tooltip>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the callout is visible." },
      { kind: "attribute", name: "heading", type: "string", description: "Callout title." },
      { kind: "attribute", name: "for", type: "string", description: "Id of the target element to point at." },
      { kind: "attribute", name: "placement", type: "string", description: "Preferred side/align (default bottom-center)." },
      { kind: "attribute", name: "step", type: "number", description: "1-based current step." },
      { kind: "attribute", name: "total", type: "number", description: "Total number of steps." },
      { kind: "attribute", name: "next-label", type: "string", description: "Override the Next label (defaults to Done on the last step)." },
      { kind: "attribute", name: "back-label", type: "string", description: "Override the Back label." },
      { kind: "slot", name: "(default)", type: "slot", description: "Callout body content." },
      { kind: "slot", name: "anchor", type: "slot", description: "Optional target element the callout points at." },
      { kind: "event", name: "next", type: "CustomEvent", description: "Emitted with { step } when Next is activated." },
      { kind: "event", name: "back", type: "CustomEvent", description: "Emitted with { step } when Back is activated." },
      { kind: "event", name: "close", type: "CustomEvent", description: "Emitted with { step } when dismissed." },
    ],
  },
  variants: [
    {
      name: "Middle step",
      html: `<box-guide-tooltip heading="Upload your files" step="2" total="4" open placement="bottom-start"><button slot="anchor">Upload</button>Drag files here or use the Upload button to add them to this folder.</box-guide-tooltip>`,
      note: "Anchored to a slotted trigger; Back/Next/Close emit detail.step for the host to drive.",
    },
    {
      name: "Final step",
      html: `<box-guide-tooltip heading="You're all set" step="4" total="4" open placement="bottom-start"><button slot="anchor">Share</button>Invite collaborators any time from the Share menu.</box-guide-tooltip>`,
    },
  ],
};

export default guideTooltip;
