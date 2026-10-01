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
      { kind: "property", name: "connections", type: "readonly ProcessConnection[]", description: "Host connection names and kinds shown in the Connections pane." },
      { kind: "property", name: "variables", type: "readonly ProcessVariable[]", description: "Host variables shown in the Variables pane." },
      { kind: "property", name: "outline", type: "readonly ProcessOutlineItem[]", description: "Nested plain-language steps in the Outline pane." },
      { kind: "property", name: "fields", type: "Record<string, ProcessField[]>", description: "Host values rendered as controlled inspector fields." },
      { kind: "property", name: "lastRun", type: "ProcessLastRun", description: "Optional per-step run metrics and label." },
      { kind: "property", name: "readback", type: "{ current, lastReadable, checks, version }", description: "Current validity and last valid projection." },
      { kind: "property", name: "selectedPath", type: "NodePath | null", description: "Host selection normalized to the deepest projected box." },
      { kind: "event", name: "projection-changed", type: "{ projection, version, checks }", description: "Changed graph version for host conversion." },
      { kind: "event", name: "readable-projection-changed", type: "{ projection, version }", description: "Only versions that pass host validation." },
      { kind: "event", name: "positions-changed", type: "{ positions, version }", description: "Detached path/fingerprint positions for host persistence." },
      { kind: "event", name: "process-field-change-request", type: "{ boxId, path, key, value }", description: "Controlled field edit for the host to validate and apply." },
      { kind: "property", name: "setView()", type: "({ x, y, zoom }) => void", description: "Restore a 25–200% canvas view." },
      { kind: "attribute", name: "heading-level", type: "number", description: "Inspector heading level 1-6 (default 2)." },
      { kind: "attribute", name: "disable-connections", type: "boolean", description: "Refuse manual connect/disconnect requests." },
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
