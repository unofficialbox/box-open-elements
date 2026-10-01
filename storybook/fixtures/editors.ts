import { CodeEditor } from "../../src/components/forms/code-editor.js";
import {
  ProcessModeler,
  type ProcessProjection,
  type ProcessEditRequest,
} from "../../src/patterns/process-modeler/index.js";

export const editorHtml = `<box-code-editor label="Workflow code" language="typescript"></box-code-editor>`;
export const modelerHtml = `<box-process-modeler snap-to-grid></box-process-modeler>`;
export function setupCodeEditor(root: HTMLElement): void {
  CodeEditor.register();
  const editor = root.querySelector<CodeEditor>("box-code-editor")!;
  editor.value =
    'const workflow = flow().step("Read file").step("Save result");';
  editor.completions = [
    { label: "step", type: "method", detail: "Add a workflow step" },
  ];
  editor.problems = [
    {
      line: 1,
      col: 18,
      endCol: 22,
      message: "Supply your host's flow builder",
      tone: "info",
    },
  ];
}
export function setupProcessModeler(root: HTMLElement): void {
  ProcessModeler.register();
  const modeler = root.querySelector<ProcessModeler>("box-process-modeler")!;
  let document: ProcessProjection = {
    boxes: [
      { id: "read", kind: "call", title: "Read file", node: {} },
      { id: "save", kind: "call", title: "Save result", node: {} },
    ],
    lines: [{ id: "read-save", from: "read", to: "save", label: "On success" }],
  };
  modeler.catalog = [
    {
      kind: "call",
      label: "Call API",
      description: "Send a request",
      group: "Actions",
      create: () => ({ kind: "call" }),
    },
  ];
  modeler.document = document;
  modeler.connections = [{ name: "Box", kind: "OAuth" }];
  modeler.variables = [{ name: "fileId", description: "File supplied by the host" }];
  let sequence = 0;
  modeler.addEventListener("process-edit-request", (event) => {
    const request = (event as CustomEvent<ProcessEditRequest>).detail;
    const before = document;
    const after: ProcessProjection = {
      boxes: [...document.boxes],
      lines: [...document.lines],
    };
    if (request.type === "add" || request.type === "insert") {
      const id = request.boxId ?? `new-${++sequence}`;
      if (!request.boxId) after.boxes = [
        ...after.boxes,
        {
          id,
          kind: request.kind?.kind ?? "call",
          title: request.kind?.label ?? "New call",
          node: request.kind?.create() ?? {},
          parentId: request.parentId,
        },
      ];
      if (request.type === "insert" && request.from && request.to)
        after.lines = [
          ...after.lines.filter((line) => line.id !== request.lineId),
          { id: `${request.from}-${id}`, from: request.from, to: id },
          { id: `${id}-${request.to}`, from: id, to: request.to },
        ];
      else if (request.type === "add" && request.from) after.lines = [...after.lines, { id: `line-${++sequence}`, from: request.from, to: id, fromSide: request.fromSide }];
    } else if (request.type === "delete") {
      after.boxes = after.boxes.filter((box) => box.id !== request.boxId);
      after.lines = after.lines.filter(
        (line) => line.from !== request.boxId && line.to !== request.boxId,
      );
    } else if (request.type === "connect" && request.from && request.to) {
      after.lines = [
        ...after.lines,
        { id: `line-${++sequence}`, from: request.from, to: request.to, fromSide: request.fromSide, toSide: request.toSide },
      ];
    } else if (request.type === "reparent") {
      after.boxes = after.boxes.map(box => box.id === request.boxId ? { ...box, parentId: request.parentId } : box);
    } else if (request.type === "disconnect")
      after.lines = after.lines.filter((line) => line.id !== request.lineId);
    const apply = (value: ProcessProjection) => {
      document = value;
      modeler.document = document;
    };
    apply(after);
    request.accept({ undo: () => apply(before), redo: () => apply(after) });
  });
  modeler.fit();
}
