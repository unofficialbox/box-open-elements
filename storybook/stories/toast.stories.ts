import type { StoryModule } from "../metadata.js";

const toast: StoryModule = {
  title: "Components/Feedback/Toast",
  meta: {
    id: "toast",
    tag: "box-toast",
    shortDescription: "A transient status message.",
    docsDescription:
      "Shows a short `message`, optionally under a bold `heading`, with a status glyph and a tone. Toggle visibility with `open`, or call `show(message, { duration, tone })`. `mode` decides whether it clears itself: `dismissible` (default) auto-dismisses after `duration`, `sticky` stays until the reader closes it and overrides any duration — both keep the close control, because a toast the reader cannot get rid of is a trap. The glyph differs in shape as well as colour (a round tick against a warning triangle), so the tone survives for a reader who cannot separate green from amber, and it is repeated as a visually hidden word for screen readers. Fill, border, shadow and text colour deliberately track box-ui-elements' `.notification` and are pinned by the colour conformance manifest; the structure — glyph, heading, icon-only close — is where the refinement lives. Slot an `action` (e.g. an Undo button/link) before the dismiss control. Long unbroken tokens wrap instead of overflowing.",
    sourceSnippet: `<box-toast open message="Upload complete" tone="success"></box-toast>`,
    referenceRows: [
      { kind: "attribute", name: "message", type: "string", description: "Toast body copy." },
      { kind: "attribute", name: "heading", type: "string", description: "Optional bold line above the message. Collapses entirely when unset, and the message then carries the heading's weight." },
      { kind: "attribute", name: "mode", type: "'dismissible' | 'sticky'", description: "Whether the toast clears itself. `sticky` overrides any `duration`. Defaults to `dismissible`; an unknown value falls back to it." },
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the toast is visible." },
      { kind: "attribute", name: "tone", type: "string", description: "Status emphasis (e.g. success, error)." },
      { kind: "attribute", name: "duration", type: "number", description: "Auto-dismiss delay in ms for the declarative open path (0 = sticky)." },
      { kind: "slot", name: "action", type: "slot", description: "Action affordance (e.g. Undo) before the dismiss button." },
      { kind: "event", name: "dismiss", type: "CustomEvent", description: "Emitted when the toast is dismissed." },
    ],
  },
  variants: [
    { name: "Success", html: `<box-toast open message="Upload complete" tone="success"></box-toast>` },
    { name: "Error", html: `<box-toast open message="Upload failed" tone="error"></box-toast>` },
    { name: "Heading and message", html: `<box-toast open heading="Upload failed" message="3 of 12 files could not be read." tone="error"></box-toast>` },
    { name: "Warning", html: `<box-toast open heading="Approval overdue" message="Waiting on Morgan Lee since Tuesday." tone="warning"></box-toast>` },
    { name: "Sticky", html: `<box-toast open mode="sticky" heading="This is a toast notification" message="Stays until you close it, whatever the duration says." tone="info"></box-toast>` },
    { name: "With action", html: `<box-toast open message="File deleted" tone="info"><button slot="action" type="button">Undo</button></box-toast>` },
    { name: "Closed", html: `<box-toast message="Hidden until open" tone="success"></box-toast>` },
  ],
};

export default toast;
