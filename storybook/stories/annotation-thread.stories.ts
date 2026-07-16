import type { StoryModule } from "../metadata.js";

const annotationThread: StoryModule = {
  title: "Patterns/Preview/Annotation Thread",
  meta: {
    id: "annotation-thread",
    tag: "box-annotation-thread",
    shortDescription: "A selectable thread of preview annotation entries.",
    docsDescription: "Pass JSON `entries` and optional JSON `actions`; set `selected-entry-id` for pressed state.",
    sourceSnippet: `<box-annotation-thread heading="Annotation Thread" entries='[{"id":"a1","author":"Morgan Lee","body":"Tighten the hero spacing."}]'></box-annotation-thread>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Thread heading." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting message." },
      { kind: "attribute", name: "entries", type: "json", description: "Annotation thread entries." },
      { kind: "attribute", name: "selected-entry-id", type: "string", description: "Selected entry id." },
      { kind: "attribute", name: "actions", type: "json", description: "Thread action buttons." },
      { kind: "event", name: "entry-selected", description: "Emitted when an entry is selected." },
      { kind: "event", name: "action", description: "Emitted with selected-entry context." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-annotation-thread heading="Annotation Thread" message="Discussion for the current file." selected-entry-id="a1" entries='[{"id":"a1","author":"Morgan Lee","body":"Tighten the hero spacing.","toolLabel":"Comment","status":"Open"},{"id":"a2","author":"Avery Chen","body":"Resolved after export.","toolLabel":"Highlight","status":"Resolved"}]' actions='[{"id":"resolve","label":"Resolve","tone":"primary"},{"id":"reply","label":"Reply"}]'></box-annotation-thread>`,
    },
  ],
};

export default annotationThread;
