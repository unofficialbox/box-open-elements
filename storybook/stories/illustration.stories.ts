import type { StoryModule } from "../metadata.js";

const illustration: StoryModule = {
  title: "Components/Visuals/Illustration",
  meta: {
    id: "illustration",
    tag: "box-illustration",
    shortDescription: "A registered empty/education illustration with optional copy.",
    docsDescription:
      "Resolves `asset` from the active design system (e.g. `empty-state-folder`). Pair with `heading` + `message` for empty states.",
    sourceSnippet: `<box-illustration asset="empty-state-folder" heading="Nothing here yet" message="Upload a file to get started."></box-illustration>`,
    referenceRows: [
      { kind: "attribute", name: "asset", type: "string", description: "Registered illustration key." },
      { kind: "attribute", name: "heading", type: "string", description: "Optional title below the art." },
      { kind: "attribute", name: "message", type: "string", description: "Optional supporting copy." },
    ],
  },
  variants: [
    {
      name: "Empty folder",
      html: `<box-illustration asset="empty-state-folder" heading="Nothing here yet" message="Upload a file to get started."></box-illustration>`,
    },
    {
      name: "Files information",
      html: `<box-illustration asset="files-information" heading="About these files" message="Details appear when you select an item."></box-illustration>`,
    },
  ],
};

export default illustration;
