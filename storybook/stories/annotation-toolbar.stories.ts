import type { StoryModule } from "../metadata.js";

const annotationToolbar: StoryModule = {
  title: "Patterns/Preview/Annotation Toolbar",
  meta: {
    id: "annotation-toolbar",
    tag: "box-annotation-toolbar",
    shortDescription: "A toolbar for preview annotation tools, colors, and actions.",
    docsDescription: "Pass JSON `tools`, `color-options`, and `actions`; set active state with `active-tool-id` and `current-color`.",
    sourceSnippet: `<box-annotation-toolbar label="Annotate" tools='[{"id":"comment","label":"Comment"},{"id":"highlight","label":"Highlight"}]'></box-annotation-toolbar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Toolbar label." },
      { kind: "attribute", name: "tools", type: "json", description: "Annotation tool buttons." },
      { kind: "attribute", name: "active-tool-id", type: "string", description: "Selected tool id." },
      { kind: "attribute", name: "color-options", type: "json", description: "Available annotation colors." },
      { kind: "attribute", name: "current-color", type: "string", description: "Selected color value." },
      { kind: "attribute", name: "actions", type: "json", description: "Toolbar action buttons." },
      { kind: "event", name: "tool-selected", description: "Emitted when a tool is selected." },
      { kind: "event", name: "color-selected", description: "Emitted when a color is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-annotation-toolbar label="Annotate" active-tool-id="comment" current-color="#f59e0b" tools='[{"id":"comment","label":"Comment"},{"id":"highlight","label":"Highlight"},{"id":"draw","label":"Draw"},{"id":"redact","label":"Redact","disabled":true}]' color-options='[{"id":"amber","label":"Amber","value":"#f59e0b"},{"id":"blue","label":"Blue","value":"#3b82f6"}]' actions='[{"id":"undo","label":"Undo"},{"id":"save","label":"Save","tone":"primary"}]'></box-annotation-toolbar>`,
    },
  ],
};

export default annotationToolbar;
