import type { StoryModule } from "../metadata.js";

const switchStory: StoryModule = {
  title: "Components/Forms/Switch",
  meta: {
    id: "switch",
    tag: "box-switch",
    shortDescription: "A binary on/off toggle.",
    docsDescription: "A labelled toggle for an immediate boolean setting; emits `change` with the new state.",
    sourceSnippet: `<box-switch label="Email notifications" checked></box-switch>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Toggle label." },
      { kind: "attribute", name: "checked", type: "boolean", description: "On state." },
      { kind: "attribute", name: "description", type: "string", description: "Optional helper text." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Renders the toggle inert." },
    ],
  },
  variants: [
    { name: "On", html: `<box-switch label="Email notifications" checked></box-switch>` },
    { name: "Off", html: `<box-switch label="Email notifications"></box-switch>` },
    { name: "With description", html: `<box-switch label="Shared links" description="Anyone with the link can view" checked></box-switch>` },
    { name: "Disabled", html: `<box-switch label="Locked setting" disabled></box-switch>` },
  ],
};

export default switchStory;
