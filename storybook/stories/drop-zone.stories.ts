import type { StoryModule } from "../metadata.js";

const dropZone: StoryModule = {
  title: "Components/Files/Drop Zone",
  meta: {
    id: "drop-zone",
    tag: "box-drop-zone",
    shortDescription: "A drag-and-drop upload target.",
    docsDescription:
      "Invite files with a label and supporting message. Dropped folders are read and traversed; the selection reports the directory each file came from.",
    sourceSnippet: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Primary drop-zone label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting instruction text." },
      {
        kind: "attribute",
        name: "accept",
        type: "string",
        description:
          "What the browse dialog offers (`.pdf,.docx`). Advisory — it does not filter a drop.",
      },
      {
        kind: "attribute",
        name: "directories",
        type: "boolean",
        description:
          "Make click-to-browse pick a folder. Dropped folders are read either way.",
      },
      {
        kind: "event",
        name: "files-selected",
        type: "CustomEvent<{ entries: UploadEntry[]; files: File[] }>",
        description:
          "A non-empty selection. `entries` pairs each file with its directory path; `files` is the flat list.",
      },
    ],
  },
  variants: [
    { name: "Default", html: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>` },
  ],
};

export default dropZone;
