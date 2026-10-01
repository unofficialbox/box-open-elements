import { CodeEditor } from "../../src/components/forms/code-editor.js";
import { iconConnectedDots, iconCode, icon2OverlaySquares, iconServer, iconConnectedTogether, icon2Chat, iconClock1, iconStopHand, iconUpDown, iconSlider, iconDistribute, iconTarget, iconShieldCheck, iconCycle, iconQuestionMark, iconClock2, iconContainerLines, iconPlay, iconSquaresScale, iconFileCopy } from "../../src/foundations/icons/glyphs/index.js";
import {
  ProcessModeler,
  type ProcessProjection,
  type ProcessEditRequest,
  type ProcessField,
  type ProcessKind,
} from "../../src/patterns/process-modeler/index.js";

export const editorHtml = `<box-code-editor label="Workflow code" language="typescript"></box-code-editor>`;
export const modelerHtml = `<box-process-modeler snap-to-grid style="--boe-process-height: calc(100vh - 56px)"></box-process-modeler>`;

let modelerGlyphSequence = 0;
const modelerGlyph = (markup: string) => () => {
  const suffix = `-modeler-${++modelerGlyphSequence}`;
  const wrapper = document.createElement('span');
  wrapper.innerHTML = markup.replace(/(id="|url\(#)([^")]+)/g, (_match, prefix: string, id: string) => `${prefix}${id}${suffix}`);
  return wrapper.firstElementChild as SVGElement;
};
const modelerBoxIcon = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 150 150");
  svg.innerHTML = '<rect x="2" y="2" width="146" height="146" rx="36" fill="#0061D5"/><g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"><path d="M31 50v29"/><circle cx="46" cy="79" r="15"/><circle cx="83" cy="79" r="15"/><path d="M106 64l20 30M126 64l-20 30"/></g>';
  return svg;
};

const modelerCatalog: ProcessKind[] = [
  { kind: "box", label: "Box action", description: "Does one thing in Box, like upload a file, and measures how long it takes", group: "Steps", aliases: ["upload", "file"], icon: modelerBoxIcon, tone: "accent", create: () => ({ kind: "box" }) },
  { kind: "web", label: "Web request", description: "Sends a request to any web address and measures how long it takes", group: "Steps", aliases: ["http", "api", "REST"], icon: modelerGlyph(iconConnectedDots), create: () => ({ kind: "web" }) },
  { kind: "code", label: "Custom code", description: "Runs code you write here. Not timed on its own", group: "Steps", aliases: ["script"], icon: modelerGlyph(iconCode), create: () => ({ kind: "code" }) },
  { kind: "subprocess", label: "Subprocess", description: "Runs another process you saved, as one step", group: "Steps", icon: modelerGlyph(icon2OverlaySquares), create: () => ({ kind: "subprocess" }) },
  { kind: "grpc", label: "gRPC call", description: "Calls a method on a gRPC service and measures how long it takes", group: "Steps", icon: modelerGlyph(iconServer), create: () => ({ kind: "grpc" }) },
  { kind: "mcp", label: "MCP tool", description: "Calls a tool, resource or prompt on a Model Context Protocol server", group: "Steps", aliases: ["agent"], icon: modelerGlyph(iconConnectedTogether), create: () => ({ kind: "mcp" }) },
  { kind: "message", label: "Agent message", description: "Sends a message to another agent", group: "Steps", icon: modelerGlyph(icon2Chat), create: () => ({ kind: "message" }) },
  { kind: "wait", label: "Think time", description: "Waits, the way a person would", group: "Steps", aliases: ["pause"], icon: modelerGlyph(iconClock1), create: () => ({ kind: "wait" }) },
  { kind: "await", label: "Wait for background work", description: "Waits until background work is done", group: "Steps", icon: modelerGlyph(iconStopHand), create: () => ({ kind: "await" }) },
  { kind: "decision", label: "Decision", description: "Takes one path, based on a yes-or-no question", group: "Paths", shape: "gateway", icon: modelerGlyph(iconUpDown), create: () => ({ kind: "decision" }) },
  { kind: "choice", label: "Weighted choice", description: "Takes one path at random, by weight", group: "Paths", shape: "gateway", icon: modelerGlyph(iconSlider), create: () => ({ kind: "choice" }) },
  { kind: "parallel", label: "Parallel", description: "Runs every outgoing path at the same time", group: "Paths", shape: "gateway", icon: modelerGlyph(iconDistribute), create: () => ({ kind: "parallel" }) },
  { kind: "join", label: "Wait for all", description: "Continues once every path is done", group: "Paths", shape: "gateway", icon: modelerGlyph(iconTarget), create: () => ({ kind: "join" }) },
  { kind: "finish", label: "Finish", description: "Where the process ends", group: "Paths", shape: "event", icon: modelerGlyph(iconTarget), create: () => ({ kind: "finish" }) },
  { kind: "try", label: "Try / Catch", description: "Runs steps inside and handles failure", group: "Containers", shape: "frame", icon: modelerGlyph(iconShieldCheck), create: () => ({ kind: "try" }) },
  { kind: "repeat", label: "Repeat", description: "Runs the steps inside several times", group: "Containers", shape: "frame", icon: modelerGlyph(iconCycle), create: () => ({ kind: "repeat" }) },
  { kind: "while", label: "Repeat while", description: "Runs steps while a condition is true", group: "Containers", shape: "frame", icon: modelerGlyph(iconQuestionMark), create: () => ({ kind: "while" }) },
  { kind: "during", label: "Repeat for a time", description: "Runs steps for a set time", group: "Containers", shape: "frame", icon: modelerGlyph(iconClock2), create: () => ({ kind: "during" }) },
  { kind: "group", label: "Timed group", description: "Measures the steps inside as one", group: "Containers", shape: "frame", icon: modelerGlyph(iconContainerLines), create: () => ({ kind: "group" }) },
  { kind: "async", label: "In the background", description: "Starts steps inside without waiting", group: "Containers", shape: "frame", icon: modelerGlyph(iconPlay), create: () => ({ kind: "async" }) },
  { kind: "section", label: "Section", description: "Frames a phase for readers", group: "For readers", placement: "section", icon: modelerGlyph(iconSquaresScale), create: () => ({ kind: "section" }) },
  { kind: "note", label: "Note", description: "Explains something in the diagram", group: "For readers", placement: "note", icon: modelerGlyph(iconFileCopy), create: () => ({ kind: "note" }) },
];
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
      { id: "start", kind: "start", title: "Start", description: "Each test user begins here", shape: "event", node: {} },
      { id: "sign-in", kind: "box", title: "Sign in to Box", description: "Gets an access token for the test user", technicalDescription: "POST /oauth2/token", node: {} },
      { id: "upload", kind: "box", title: "Upload a file", description: "Sends a 1 MB test file to a shared folder", technicalDescription: "POST /files/content", node: {} },
      { id: "decision", kind: "parallel", title: "Check two ways", description: "Both checks run at once", shape: "gateway", node: {} },
      { id: "download", kind: "box", title: "Download it back", description: "Confirms the content matches what was sent", technicalDescription: "GET /files/:id/content", node: {} },
      { id: "pause", kind: "wait", title: "Pause like a person", description: "Waits before searching", node: {} },
      { id: "search", kind: "box", title: "Search for it", description: "Finds the file by its name", technicalDescription: "GET /search", node: {} },
      { id: "merge", kind: "join", title: "Both checks done", shape: "gateway", node: {} },
      { id: "found", kind: "decision", title: "Did search find it?", description: "Search can lag a few seconds behind uploads", shape: "gateway", node: {} },
      { id: "retry", kind: "try", title: "Search once more", description: "Gives the index time, then searches again", frame: true, loopMark: true, node: {} },
      { id: "wait2", kind: "wait", title: "Give search time", description: "Waits 2 s for the search index", parentId: "retry", node: {} },
      { id: "search2", kind: "box", title: "Search again", description: "Repeats the same search", parentId: "retry", node: {} },
      { id: "missed", kind: "code", title: "Note the missed search", description: "Marks the report when search lagged", node: {} },
      { id: "delete", kind: "box", title: "Delete the file", description: "Removes the test file for good", node: {} },
      { id: "finish", kind: "finish", title: "Finish", shape: "event", node: {} },
    ],
    lines: [
      { id: "start-sign-in", from: "start", to: "sign-in" },
      { id: "sign-in-upload", from: "sign-in", to: "upload" },
      { id: "upload-decision", from: "upload", to: "decision" },
      { id: "decision-download", from: "decision", to: "download" },
      { id: "decision-pause", from: "decision", to: "pause" },
      { id: "pause-search", from: "pause", to: "search" },
      { id: "download-merge", from: "download", to: "merge" },
      { id: "search-merge", from: "search", to: "merge" },
      { id: "merge-found", from: "merge", to: "found" },
      { id: "found-delete", from: "found", to: "delete", label: "Yes", share: 0.92 },
      { id: "found-retry", from: "found", to: "retry", label: "No", share: 0.08 },
      { id: "retry-delete", from: "retry", to: "delete" },
      { id: "wait2-search2", from: "wait2", to: "search2" },
      { id: "retry-missed", from: "retry", to: "missed", label: "If it fails", dashed: true },
      { id: "missed-delete", from: "missed", to: "delete" },
      { id: "delete-finish", from: "delete", to: "finish" },
    ],
  };
  modeler.model = { project: value => value, validate: () => [] };
  modeler.catalog = modelerCatalog;
  modeler.document = document;
  modeler.layout = {
    boxes: {
      start: { x: 130, y: 310, width: 56, height: 56 },
      "sign-in": { x: 263, y: 306, width: 224, height: 64 },
      upload: { x: 580, y: 306, width: 224, height: 64 },
      decision: { x: 896, y: 310, width: 56, height: 56 },
      download: { x: 1030, y: 235, width: 224, height: 64 },
      pause: { x: 1030, y: 385, width: 224, height: 64 },
      search: { x: 1350, y: 385, width: 224, height: 64 },
      merge: { x: 1660, y: 310, width: 56, height: 56 },
      found: { x: 1810, y: 310, width: 56, height: 56 },
      retry: { x: 1990, y: 435, width: 480, height: 160 },
      wait2: { x: 2020, y: 500, width: 180, height: 64 },
      search2: { x: 2220, y: 500, width: 224, height: 64 },
      missed: { x: 2530, y: 500, width: 224, height: 64 },
      delete: { x: 2790, y: 310, width: 224, height: 64 },
      finish: { x: 3110, y: 310, width: 56, height: 56 },
    },
    sections: [
      { id: "sign-in-section", title: "1   Sign in", description: "The test user gets access to Box", x: 90, y: 180, width: 430, height: 530 },
      { id: "store-section", title: "2   Store the file", description: "Put a known file in Box", x: 543, y: 180, width: 300, height: 530 },
      { id: "confirm-section", title: "3   Confirm it arrived", description: "Check the file two ways", x: 863, y: 180, width: 740, height: 530 },
      { id: "clean-section", title: "4   Clean up", description: "Leave the account as it was", x: 2760, y: 180, width: 460, height: 530 },
    ],
    notes: [{ id: "search-indexing", text: "Search indexing usually takes under 5 s. If both retries miss, the run records a failed check and still cleans up.", x: 1870, y: 650 }],
  };
  modeler.lastRun = { label: "Last run", steps: { "sign-in": { callsPerSecond: 0.4, p95Ms: 182 }, upload: { callsPerSecond: 25, p95Ms: 412 }, download: { callsPerSecond: 25, p95Ms: 238 }, pause: { callsPerSecond: 25, p95Ms: 2890 }, search: { callsPerSecond: 24.9, p95Ms: 1240 }, wait2: { callsPerSecond: 2, p95Ms: 2000 }, search2: { callsPerSecond: 2, p95Ms: 1110, failedShare: 0.016 }, delete: { callsPerSecond: 24.9, p95Ms: 96, failedShare: 0.002 } } };
  modeler.processTitle = "Upload round trip";
  modeler.processSummary = "13 steps in 4 sections";
  modeler.outline = [
    { title: "Sign in", children: [{ title: "Sign in to Box", description: "Gets an access token for the test user", boxId: "sign-in" }] },
    { title: "Store the file", children: [{ title: "Upload a file", description: "Sends a 1 MB test file to a shared folder", boxId: "upload" }] },
    { title: "Confirm it arrived", children: [
      { title: "Check two ways: do these at the same time", description: "Both checks run at once", boxId: "decision", children: [
        { title: "Path 1", children: [{ title: "Download it back", description: "Confirms the content matches what was sent", boxId: "download" }] },
        { title: "Path 2", children: [{ title: "Pause like a person", description: "Waits before searching", boxId: "pause" }, { title: "Search for it", description: "Finds the file by its name", boxId: "search" }] },
      ] },
      { title: "When every path is done, continue", children: [{ title: "Both checks done", boxId: "merge" }] },
      { title: "Ask: Did search find it?", description: "Search can lag a few seconds behind uploads", boxId: "found", children: [
        { title: "Yes", children: [{ title: "Delete the file", boxId: "delete" }] },
        { title: "No", children: [{ title: "Search once more", boxId: "retry", children: [
          { title: "Give search time", boxId: "wait2" }, { title: "Search again", boxId: "search2" },
        ] }, { title: "If it fails", children: [{ title: "Note the missed search", boxId: "missed" }] }] },
      ] },
    ] },
    { title: "Clean up", children: [{ title: "Delete the file", description: "Removes the test file for good", boxId: "delete" }, { title: "Finish", boxId: "finish" }] },
  ];
  modeler.connections = [{ name: "Box", kind: "OAuth" }];
  modeler.variables = [{ name: "fileId", description: "ID of the uploaded file" }];
  const supplementalFields: Record<string, ProcessField[]> = {
    "sign-in": [
      { key: "connection", label: "Signs in with", kind: "choice", value: "Box", options: [{ value: "Box", label: "Box" }] },
      { key: "saveAs", label: "Save the result as", kind: "text", value: "accessToken" },
    ],
    upload: [
      { key: "action", label: "Box action", kind: "action", value: "files.upload", placeholder: "Find an action, like upload file", options: [{ value: "files.upload", label: "Upload file", group: "Files" }, { value: "files.download", label: "Download file", group: "Files" }, { value: "search.query", label: "Search files", group: "Search" }] },
      { key: "fileName", label: "File name", kind: "expression", value: "test-upload.txt", description: "Variables in scope can be inserted below." },
    ],
    decision: [{ key: "condition", label: "Condition", kind: "expression", value: "downloaded == uploaded", description: "Write an expression using variables in scope." }],
    pause: [{ key: "duration", label: "Wait at least (ms)", kind: "number", value: 500 }],
  };
  const fieldValues = new Map<string, string | number | boolean>();
  const makeFields = (): Record<string, ProcessField[]> => Object.fromEntries(document.boxes.map(box => [box.id, [
    { key: "name", label: box.kind === "decision" ? "Question" : "Name", kind: "text", value: box.title },
    { key: "purpose", label: "Why it's here", kind: "multiline", value: box.description ?? "", description: "Shown in Business view and the outline." },
    ...(supplementalFields[box.id] ?? []).map(field => ({ ...field, value: fieldValues.get(`${box.id}:${field.key}`) ?? field.value })),
  ] as ProcessField[]]));
  modeler.fields = makeFields();
  modeler.addEventListener('process-field-change-request', event => {
    const { boxId, key, value } = (event as CustomEvent<{ boxId: string; key: string; value: string | number | boolean }>).detail;
    if (key === 'name' || key === 'purpose') {
      document = { ...document, boxes: document.boxes.map(box => box.id === boxId ? { ...box, [key === 'name' ? 'title' : 'description']: String(value) } : box) };
      modeler.document = document;
    } else fieldValues.set(`${boxId}:${key}`, value);
    modeler.fields = makeFields();
  });
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
      const visualKind = modelerCatalog.find(kind => kind.kind === request.kind?.kind);
      if (!request.boxId) after.boxes = [
        ...after.boxes,
        {
          id,
          kind: request.kind?.kind ?? "call",
          title: request.kind?.label ?? "New call",
          shape: visualKind?.shape,
          frame: visualKind?.shape === "frame",
          loopMark: ['repeat', 'while', 'during'].includes(request.kind?.kind ?? ''),
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
      else if (request.type === "add" && request.from) after.lines = [...after.lines, { id: `line-${++sequence}`, from: request.from, to: id, fromSide: request.fromSide, label: request.routeLabel, dashed: request.dashed }];
    } else if (request.type === "delete") {
      after.boxes = after.boxes.filter((box) => box.id !== request.boxId);
      after.lines = after.lines.filter(
        (line) => line.from !== request.boxId && line.to !== request.boxId,
      );
    } else if (request.type === "duplicate") {
      const source = after.boxes.find(box => box.id === request.sourceId);
      if (source) after.boxes = [...after.boxes, { ...source, id: `copy-${++sequence}`, title: `${source.title} copy` }];
    } else if (request.type === "connect" && request.from && request.to) {
      after.lines = [
        ...after.lines,
        { id: `line-${++sequence}`, from: request.from, to: request.to, fromSide: request.fromSide, toSide: request.toSide },
      ];
    } else if (request.type === "reattach") {
      after.lines = after.lines.map(line => line.id === request.lineId ? { ...line, from: request.from ?? line.from, to: request.to ?? line.to, ...(request.from ? { fromSide: request.fromSide } : {}), ...(request.to ? { toSide: request.toSide } : {}) } : line);
    } else if (request.type === "reparent") {
      after.boxes = after.boxes.map(box => box.id === request.boxId ? { ...box, parentId: request.parentId } : box);
    } else if (request.type === "disconnect")
      after.lines = after.lines.filter((line) => line.id !== request.lineId);
    const apply = (value: ProcessProjection) => {
      document = value;
      modeler.document = document;
      modeler.fields = makeFields();
    };
    apply(after);
    request.accept({ undo: () => apply(before), redo: () => apply(after) });
  });
  modeler.setView(window.innerWidth < 900 ? { x: -24, y: 96, zoom: 0.55 } : { x: 0, y: 94, zoom: 0.7 });
}
