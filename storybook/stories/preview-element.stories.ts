import type { StoryModule } from "../metadata.js";

const previewElement: StoryModule = {
  title: "Patterns/Preview/Preview Element",
  meta: {
    id: "preview-element",
    tag: "box-preview-element",
    shortDescription: "A provider-neutral preview workspace shell.",
    docsDescription: "Use attributes for shell copy plus JSON `provider`, `adapter-state`, and `actions`; slot toolbar, stage, and sidebar content.",
    sourceSnippet: `<box-preview-element heading="Quarterly Plan.pdf" item-label="PDF - 2.4 MB" status="Ready" provider='{"id":"content-preview","label":"Box Content Preview","engine":"pdf.js","status":"ready"}'></box-preview-element>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Preview title." },
      { kind: "attribute", name: "item-label", type: "string", description: "Item metadata label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting message." },
      { kind: "attribute", name: "provider-label", type: "string", description: "Fallback provider label." },
      { kind: "attribute", name: "status", type: "string", description: "Fallback provider status." },
      { kind: "attribute", name: "provider", type: "json", description: "Preview provider summary." },
      { kind: "attribute", name: "adapter-state", type: "json", description: "Current adapter state chips." },
      { kind: "attribute", name: "actions", type: "json", description: "Preview shell action buttons." },
      { kind: "slot", name: "toolbar", description: "Preview toolbar content." },
      { kind: "slot", name: "stage", description: "Preview stage content." },
      { kind: "slot", name: "sidebar", description: "Preview sidebar content." },
      { kind: "event", name: "action", description: "Emitted when a shell action is selected." },
      { kind: "event", name: "provider-action", description: "Emitted with provider context." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-preview-element heading="Quarterly Plan.pdf" item-label="PDF - 2.4 MB" status="Ready" message="Rendered by the active preview provider." provider='{"id":"content-preview","label":"Box Content Preview","engine":"pdf.js","status":"ready","capabilities":["annotations","downloads"]}' adapter-state='{"ready":true,"pageLabel":"Page 2 of 34","zoomLabel":"100%","mode":"Review"}' actions='[{"id":"open-provider","label":"Open provider","tone":"primary"}]'><box-annotation-toolbar slot="toolbar" label="Annotate" active-tool-id="comment" tools='[{"id":"comment","label":"Comment"},{"id":"highlight","label":"Highlight"}]'></box-annotation-toolbar><div slot="stage">Preview stage</div><box-annotation-thread slot="sidebar" heading="Discussion" entries='[{"id":"a1","author":"Morgan Lee","body":"Tighten the hero spacing.","toolLabel":"Comment","status":"Open"}]'></box-annotation-thread></box-preview-element>`,
    },
  ],
};

export default previewElement;
