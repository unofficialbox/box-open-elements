import type { StoryModule } from "../metadata.js";
import { modelerHtml, setupProcessModeler } from "../fixtures/editors.js";
const story: StoryModule = {
  title: "Patterns/Builders/Process Modeler",
  meta: {
    id: "process-modeler",
    tag: "box-process-modeler",
    shortDescription: "A diagram canvas that projects a host-owned document.",
    docsDescription:
      "Pass document, model, catalog and layout. Accept or refuse process-edit-request in your host; retain layout separately from workflow data.",
    sourceSnippet: modelerHtml,
    referenceRows: [
      {
        kind: "property",
        name: "model",
        type: "ProcessModel",
        description: "Projects a host document as boxes and lines.",
      },
      {
        kind: "property",
        name: "layout",
        type: "ProcessLayout",
        description:
          "Serializable positions, sizes, notes and hand-adjusted lines.",
      },
      {
        kind: "event",
        name: "process-edit-request",
        type: "ProcessEditRequest",
        description:
          "Host applies an edit and accepts its undo/redo callbacks, or refuses it.",
      },
      {
        kind: "event",
        name: "layout-changed",
        type: "{ layout }",
        description: "Accepted layout edit or history replay.",
      },
    ],
  },
  variants: [
    {
      name: "Editable workflow",
      html: modelerHtml,
      setup: setupProcessModeler,
    },
  ],
};
export default story;
