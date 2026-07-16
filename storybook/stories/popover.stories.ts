import type { StoryModule } from "../metadata.js";

const popover: StoryModule = {
  title: "Components/Overlays/Popover",
  meta: {
    id: "popover",
    tag: "box-popover",
    shortDescription: "A small anchored overlay for extra info or actions.",
    docsDescription: "Toggle with `open`. `label` names the trigger; light-DOM children are the popover body.",
    sourceSnippet: `<box-popover label="More info" placement="top" open>Shared links expire automatically.</box-popover>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Trigger label / accessible name." },
      { kind: "attribute", name: "open", type: "boolean", description: "Forces the popover open." },
      { kind: "attribute", name: "placement", type: "string", description: "Preferred placement." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the trigger." },
      { kind: "slot", name: "default", description: "Popover body content." },
    ],
  },
  variants: [
    {
      name: "Open",
      html: `<box-popover label="More info" placement="top" open>Shared links expire automatically.</box-popover>`,
    },
    {
      name: "Closed",
      html: `<box-popover label="More info" placement="top">Shared links expire automatically.</box-popover>`,
    },
  ],
};

export default popover;
