import type { StoryModule } from "../metadata.js";

const annotationThread: StoryModule = {
  title: "Patterns/Preview/Annotation Thread",
  meta: {
    id: "annotation-thread",
    tag: "box-annotation-thread",
    shortDescription: "A comment thread anchored to a place in a document.",
    docsDescription:
      "This is `box-comment-thread` plus an anchor, and the anchor is the whole distinction: comments stand on their own — on a file, a task, a contract clause — and only become annotations when something ties them to a page, a region, or a run of selected text. A thread with nothing to anchor to belongs on `box-comment-thread` instead, which is why that component exists separately rather than this one pretending to cover both. Everything else — entries, selection, actions, the composer, and the `entry-submitted` event carrying `inReplyToId` — is inherited unchanged. A region is described to the reader by its page rather than by its coordinates, because the numbers place a highlight for a renderer but tell a reader nothing, and a screen reader least of all.",
    sourceSnippet: `<box-annotation-thread anchor='{"page":4}' entries='[{"id":"a1","author":"Morgan Lee","body":"Push for ninety days."}]'></box-annotation-thread>`,
    referenceRows: [
      { kind: "attribute", name: "anchor", type: "AnnotationAnchor", description: "Where in the document the thread sits, as JSON: `page`, `region` ({ x, y, width, height }), and/or `quote`. Every field is optional; an anchor with nothing renderable is hidden." },
      { kind: "attribute", name: "entries", type: "AnnotationThreadEntry[]", description: "The comments, as JSON. `toolLabel` names the annotation tool that produced one and renders as the pill." },
      { kind: "attribute", name: "composable", type: "boolean", description: "Shows the composer, labelled `Reply`." },
      { kind: "attribute", name: "heading", type: "string", description: "Thread heading. Defaults to `Annotation Thread`." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting message." },
      { kind: "attribute", name: "selected-entry-id", type: "string", description: "Selected entry id, which is also the reply target." },
      { kind: "attribute", name: "actions", type: "AnnotationThreadAction[]", description: "Thread action buttons, as JSON." },
      { kind: "event", name: "entry-selected", description: "Emitted when an entry is selected." },
      { kind: "event", name: "entry-submitted", description: "A reply was composed. `detail: { body, inReplyToId }`." },
      { kind: "event", name: "action", description: "Emitted with selected-entry context." },
      { kind: "part", name: "anchor", type: "part", description: "The anchor block in the header." },
      { kind: "part", name: "anchor-quote", type: "part", description: "The quoted document text." },
    ],
  },
  variants: [
    {
      name: "Anchored to selected text",
      html: `<box-annotation-thread composable heading="Annotation Thread" anchor='{"page":4,"quote":"Either party may terminate for convenience upon thirty (30) days written notice."}' selected-entry-id="a1" entries='[{"id":"a1","author":"Morgan Lee","body":"Thirty days is short for this contract value — push for ninety.","createdAt":"Today, 11:02 AM","toolLabel":"Highlight","status":"Open"},{"id":"a2","author":"Avery Chen","body":"Agreed. Redlined in v4.","createdAt":"Today, 11:40 AM","toolLabel":"Comment","status":"Resolved"}]' actions='[{"id":"resolve","label":"Resolve","tone":"primary"},{"id":"reply","label":"Reply"}]'></box-annotation-thread>`,
      note: "The quote is shown as a citation rather than as another comment, so the document text is not mistaken for something a person said in the thread.",
    },
    {
      name: "Anchored to a region",
      html: `<box-annotation-thread heading="Annotation Thread" anchor='{"page":2,"region":{"x":120,"y":340,"width":220,"height":64}}' entries='[{"id":"a1","author":"Avery Chen","body":"This figure does not match the summary table.","toolLabel":"Draw","status":"Open"}]'></box-annotation-thread>`,
      note: "A drawn box reads as \"Page 2 · region\". The coordinates position the highlight for the renderer and are deliberately not read out.",
    },
    {
      name: "Without an anchor",
      html: `<box-annotation-thread heading="Annotation Thread" message="Discussion for the current file." selected-entry-id="a1" entries='[{"id":"a1","author":"Morgan Lee","body":"Tighten the hero spacing.","toolLabel":"Comment","status":"Open"},{"id":"a2","author":"Avery Chen","body":"Resolved after export.","toolLabel":"Highlight","status":"Resolved"}]' actions='[{"id":"resolve","label":"Resolve","tone":"primary"},{"id":"reply","label":"Reply"}]'></box-annotation-thread>`,
      note: "The anchor block collapses entirely. This still renders, but it is the case `box-comment-thread` is for — reach for that instead of an annotation with nothing to point at.",
    },
  ],
};

export default annotationThread;
