import type { StoryModule } from "../metadata.js";

const commentThread: StoryModule = {
  title: "Patterns/Comments/Comment Thread",
  meta: {
    id: "comment-thread",
    tag: "box-comment-thread",
    shortDescription: "A comment thread that stands on its own.",
    docsDescription:
      "Comments are a standalone concept. They hang off a file, a folder, a task or a contract clause just as readily as off a region of a document, so this thread does not know what it is attached to — it renders authored entries, selection, actions and a composer, and nothing else. A host that needs comments tied to a place in a document composes an anchor on top; `box-annotation-thread` is exactly that, and the anchor is the only thing that makes an annotation an annotation. Selection doubles as the reply target: `entry-submitted` carries `inReplyToId`, which is the selected entry or `null`, so one event serves both a new top-level comment and a reply and the host decides which by reading it. Bodies are rendered as text rather than markup, because comment bodies are the most author-controlled string on the page.",
    sourceSnippet: `<box-comment-thread composable entries='[{"id":"c1","author":"Morgan Lee","body":"Finance signed off."}]'></box-comment-thread>`,
    referenceRows: [
      { kind: "attribute", name: "entries", type: "CommentEntry[]", description: "The comments, as JSON. Each carries `id`, `author`, `body`, and optionally `initials`, `createdAt`, `badge` and `status`." },
      { kind: "attribute", name: "composable", type: "boolean", description: "Shows the composer. Absent by default, so a read-only thread stays read-only." },
      { kind: "attribute", name: "selected-entry-id", type: "string", description: "The selected comment, which is also the reply target." },
      { kind: "attribute", name: "actions", type: "CommentAction[]", description: "Buttons beneath the thread, as JSON. A `tone` of `primary` renders the brand treatment." },
      { kind: "attribute", name: "composer-label", type: "string", description: "Composer label and submit text. Defaults to `Comment`; `box-annotation-thread` defaults it to `Reply`." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Composer placeholder. Defaults to `Add a comment`." },
      { kind: "attribute", name: "heading", type: "string", description: "Thread heading. Defaults to `Comments`." },
      { kind: "attribute", name: "message", type: "string", description: "Optional supporting line under the heading." },
      { kind: "event", name: "entry-submitted", type: "CommentSubmittedDetail", description: "A comment was composed. `detail: { body, inReplyToId }`." },
      { kind: "event", name: "entry-selected", type: "CommentEntry", description: "A comment was selected." },
      { kind: "event", name: "action", type: "{ action, selectedEntryId }", description: "A thread action was pressed." },
      { kind: "part", name: "thread", type: "part", description: "The thread container." },
      { kind: "part", name: "entry", type: "part", description: "One comment button." },
      { kind: "part", name: "composer", type: "part", description: "The composer region." },
    ],
  },
  variants: [
    {
      name: "On a file",
      html: `<box-comment-thread composable heading="Comments" message="Discussion on Master Services Agreement.pdf — not tied to any page." entries='[{"id":"c1","author":"Morgan Lee","body":"Finance signed off on the payment terms.","createdAt":"Yesterday, 4:12 PM","badge":"Finance","status":"Resolved"},{"id":"c2","author":"Avery Chen","body":"Still waiting on the security questionnaire before we counter-sign.","createdAt":"Today, 9:40 AM","badge":"Legal","status":"Open"}]'></box-comment-thread>`,
      note: "The standalone case. Nothing here refers to a page or a region, because a comment on a file is not an annotation.",
    },
    {
      name: "Read-only",
      html: `<box-comment-thread heading="Comments" entries='[{"id":"c1","author":"Morgan Lee","body":"Archived thread — retained for the audit trail."}]'></box-comment-thread>`,
      note: "Without `composable` the composer is absent rather than disabled, so a retained thread offers no affordance to add to it.",
    },
    {
      name: "Empty",
      html: `<box-comment-thread composable heading="Comments"></box-comment-thread>`,
      note: "The empty state still shows the composer, since the first comment has to start somewhere.",
    },
    {
      name: "With actions",
      html: `<box-comment-thread heading="Comments" entries='[{"id":"c1","author":"Avery Chen","body":"Ready to close this out."}]' actions='[{"id":"resolve","label":"Resolve thread","tone":"primary"},{"id":"follow","label":"Follow"}]'></box-comment-thread>`,
      note: "Actions apply to the thread, and carry the selected entry in their event so a host can scope them to one comment.",
    },
  ],
};

export default commentThread;
