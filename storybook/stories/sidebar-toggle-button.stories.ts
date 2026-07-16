import type { StoryModule } from "../metadata.js";

const sidebarToggleButton: StoryModule = {
  title: "Components/Layout/Sidebar Toggle Button",
  meta: {
    id: "sidebar-toggle-button",
    tag: "box-sidebar-toggle-button",
    shortDescription: "A disclosure button for expanding or collapsing a companion sidebar.",
    docsDescription: "Set `label` and optional `controls`; activation toggles `expanded` and emits `toggle` for the host to wire to a sidebar.",
    sourceSnippet: `<box-sidebar-toggle-button label="Toggle navigation" controls="demo-nav-sidebar"></box-sidebar-toggle-button>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible button label." },
      { kind: "attribute", name: "controls", type: "string", description: "ID of the controlled sidebar." },
      { kind: "attribute", name: "expanded", type: "string", description: "`true` or `false`; defaults to expanded." },
      { kind: "attribute", name: "disabled", type: "boolean", description: "Disables the toggle button." },
      { kind: "event", name: "toggle", type: "CustomEvent", description: "Emitted with `detail.expanded` after activation." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-sidebar-toggle-button label="Toggle navigation" controls="demo-nav-sidebar"></box-sidebar-toggle-button>`,
    },
  ],
};

export default sidebarToggleButton;
