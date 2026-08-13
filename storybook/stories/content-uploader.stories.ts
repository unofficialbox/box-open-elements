import type { StoryModule } from "../metadata.js";

const contentUploader: StoryModule = {
  title: "Patterns/Content Uploader/Content Uploader",
  meta: {
    id: "content-uploader",
    tag: "box-content-uploader",
    shortDescription: "Upload queue composed from the drop-zone and progress components over a narrow transport contract.",
    docsDescription:
      "The uploader shows how a workflow pattern layers on the catalog: box-drop-zone and box-progress-bar provide the chrome, ContentUploaderController owns the queue (constraint-validated enqueue, concurrency-limited pump, per-item cancel/retry), and the UploadTransport contract is one method — uploadFile — so multipart, chunked sessions, or a BFF are interchangeable behind it without touching the queue or the shell.",
    sourceSnippet: `<box-content-uploader folder-id="0" token="…" concurrency="2" extensions="pdf,docx" max-file-size="10485760"></box-content-uploader>`,
    referenceRows: [
      { kind: "attribute", name: "folder-id", type: "string", description: "Destination folder for every upload." },
      { kind: "attribute", name: "token", type: "string", description: "Session token handed to the transport." },
      { kind: "attribute", name: "concurrency", type: "number", description: "Simultaneous uploads (default 2)." },
      { kind: "attribute", name: "auto-start", type: "string", description: "Set \"false\" to queue without uploading until start()." },
      { kind: "attribute", name: "extensions", type: "string", description: "Comma-separated extension allowlist." },
      { kind: "attribute", name: "max-file-size", type: "number", description: "Reject files larger than this many bytes." },
      { kind: "property", name: "transport", type: "UploadTransport", description: "One capability: uploadFile(request) → { fileId }." },
      { kind: "event", name: "item-rejected", description: "A file failed the constraints: extension-not-allowed or file-too-large." },
      { kind: "event", name: "item-succeeded", description: "An upload finished — detail carries the remote fileId." },
      { kind: "event", name: "item-failed", description: "An upload errored; the row keeps a Retry action." },
      { kind: "event", name: "queue-drained", description: "The last active item settled — detail tallies succeeded/failed/cancelled." },
    ],
  },
  variants: [
    {
      name: "Queue states",
      html: `<box-content-uploader folder-id="0" token="…" drop-label="Upload to All Files"></box-content-uploader>`,
      note: "Rows rebuild only on status changes; progress bars are patched in place so in-row focus survives ticks.",
    },
  ],
};

export default contentUploader;
