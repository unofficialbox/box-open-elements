import type { StoryModule } from "../metadata.js";

const annotationInspector: StoryModule = {
  title: "Patterns/Preview/Annotation Inspector",
  meta: {
    id: "annotation-inspector",
    tag: "box-annotation-inspector",
    shortDescription: "A side panel for the selected preview annotation.",
    docsDescription: "Pass a JSON `annotation` object with optional replies, and JSON `actions` for annotation commands.",
    sourceSnippet: `<box-annotation-inspector heading="Annotation Inspector" annotation='{"id":"a1","author":"Morgan Lee","body":"Tighten the tagline hierarchy near the hero title."}'></box-annotation-inspector>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting message." },
      { kind: "attribute", name: "annotation", type: "json", description: "Selected annotation details." },
      { kind: "attribute", name: "actions", type: "json", description: "Annotation action buttons." },
      { kind: "event", name: "action", description: "Emitted when an annotation action is selected." },
      { kind: "event", name: "reply-selected", description: "Emitted when a reply is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-annotation-inspector heading="Annotation Inspector" message="Selected annotation details." annotation='{"id":"a1","author":"Morgan Lee","body":"Tighten the tagline hierarchy near the hero title.","toolLabel":"Comment","pageLabel":"Page 4","status":"Open","subject":"Hero copy","replies":[{"author":"Avery Chen","body":"Agreed, I will update the draft.","initials":"AC"}]}' actions='[{"id":"resolve","label":"Resolve","tone":"primary"},{"id":"reply","label":"Reply"}]'></box-annotation-inspector>`,
    },
  ],
};

export default annotationInspector;
