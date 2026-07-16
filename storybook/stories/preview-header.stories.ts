import type { StoryModule } from "../metadata.js";

const previewHeader: StoryModule = {
  title: "Patterns/Item/Preview Header",
  meta: {
    id: "preview-header",
    tag: "box-preview-header",
    shortDescription: "A preview title header with breadcrumbs, status, and actions.",
    docsDescription: "Set preview heading/status/message attributes and pass breadcrumbs plus action buttons as JSON.",
    sourceSnippet: `<box-preview-header heading="Quarterly Plan.pdf" status="Shared" breadcrumbs='[{"id":"0","label":"All Files"}]'></box-preview-header>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Preview item title." },
      { kind: "attribute", name: "status", type: "string", description: "Status chip label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting preview copy." },
      { kind: "attribute", name: "breadcrumbs", type: "json", description: "Breadcrumb buttons." },
      { kind: "attribute", name: "actions", type: "json", description: "Header action buttons." },
      { kind: "event", name: "breadcrumb-selected", type: "CustomEvent", description: "Emitted when a breadcrumb is selected." },
      { kind: "event", name: "action", type: "CustomEvent", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-preview-header heading="Quarterly Plan.pdf" status="Shared" message="Rendered by the active preview provider." breadcrumbs='[{"id":"0","label":"All Files"},{"id":"42","label":"Marketing"}]' actions='[{"id":"share","label":"Share"},{"id":"download","label":"Download"}]'></box-preview-header>`,
    },
  ],
};

export default previewHeader;
