import type { StoryModule } from "../metadata.js";

const dropZone: StoryModule = {
  title: "Components/Files/Drop Zone",
  meta: {
    id: "drop-zone",
    tag: "box-drop-zone",
    shortDescription: "A drag-and-drop upload target.",
    docsDescription: "Invite files with a label and supporting message.",
    sourceSnippet: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Primary drop-zone label." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting instruction text." },
    ],
  },
  variants: [
    { name: "Default", html: `<box-drop-zone label="Upload files" message="Drag files here or browse."></box-drop-zone>` },
  ],
};

export default dropZone;
