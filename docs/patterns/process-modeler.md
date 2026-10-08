# Process modeler

`box-process-modeler` is the reusable canvas, palette and details panel for the
Riptide Diagram design. It projects a host document as boxes and connections,
but does not translate drawings into workflows or save them. Riptide or another
host owns its schema, read-back conversion, persistence and save policy.

```mermaid
flowchart LR
  Document[Host document] --> Model[Host model.project]
  Model --> Canvas[ProcessModeler]
  Layout[Separate layout file] --> Canvas
  Canvas --> Request[process-edit-request]
  Request --> Host[Host validation and edit]
  Host --> Document
  Host --> History[accept undo and redo callbacks]
  Canvas --> Save[positions-changed: host saves layout]
  Canvas --> Positions[positions-changed: path and fingerprint snapshots]
  Canvas --> Validation[Host model.validate: read-back and problems]
  Validation --> Hold[Invalid drawing: hold and Checks]
  Validation -->|valid only| Readable[readable-projection-changed]
  Readable --> Conversion[Host graph-to-workflow conversion and save]
  Conversion --> Canvas
```

```ts
import { ProcessModeler } from "@unofficialbox/box-open-elements/patterns/process-modeler";
const canvas = document.querySelector("box-process-modeler") as ProcessModeler;
canvas.model = {
  project: doc => ({ boxes: doc.boxes, lines: doc.lines }),
  validate: (doc, projection) => readBackProblems(doc, projection),
};
canvas.load(document, { version: 12, positions: savedPositions });
canvas.catalog = hostCatalog; // Reuse the same kind list as Flow Builder.
canvas.outline = hostOutline;
canvas.fields = hostFieldsByBoxId;
canvas.lastRun = hostRunMetrics;
canvas.addEventListener("process-edit-request", event => {
  // The host applies or refuses the edit; it owns undo/redo of the document.
  // On acceptance, assign the new document and call:
  // event.detail.accept({ undo: restoreBefore, redo: applyAfter });
});
canvas.addEventListener("positions-changed", event => savePositions(event.detail.positions));
canvas.addEventListener("readable-projection-changed", event => {
  // Only valid versions arrive here. Convert with your own workflow schema.
  keepLastReadableWorkflow(convertGraph(event.detail.projection));
});
```

## Contract

- `ProcessModel.project(document)` returns boxes with stable IDs, host node
  references, kind/title, optional path and frame/parent IDs; lines have unique
  IDs, existing endpoints, optional labels, dashed style and authored points.
- `ProcessModel.arrange(projection)` optionally supplies the host's layout for
  Tidy up and missing positions. Existing authored positions win on refresh;
  Tidy up intentionally recomputes them. Without a hook, `arrangeProcess` lays
  out connected steps left to right, branches vertically, and sizes nested
  frames around their children. Cycles remain visible and appear in Checks.
- `layout` is copied on assignment/read. It preserves positions/sizes, notes,
  sections and line control points separately from workflow data. Missing box
  positions receive a deterministic fallback. `load(document, options)` accepts
  saved positions keyed by `JSON.stringify(path)` or position snapshots; only
  matching paths and explicit matching fingerprints are restored.
- `catalog` uses `ProcessKind` entries shared with Flow Builder, with optional
  search aliases and visual shapes. The grouped palette supports keyboard add
  or drag/drop. Add/delete/duplicate/connect/disconnect/reattach/insert/reparent requests are
  delivered as `process-edit-request`; no document mutation happens implicitly.
  The host supplies reversible callbacks via `accept()` after applying an edit.
  Accepted adds use the requested drop position; document callbacks and the
  corresponding canvas layout restore together as one undoable edit.
  Pass `accept({ undo, redo, layout })` to atomically retain the edit's new
  positions without clearing earlier history; accepted host layout takes priority
  over a requested position. Existing-box insert/reparent positions are retained
  atomically too. Palette clicks omit position;
  drops include one. Line insert opens the grouped kind chooser when a catalog
  exists and includes the chosen `kind` in the request.
- `move-request` is cancelable. Accepted moves and Tidy up emit `layout-changed`
  and join the same bounded history as host-accepted edits. `undo()` and `redo()`
  replay callbacks. Different external layout replacements clear history;
  controlled echoes and layout assignments inside undo/redo preserve it.
  Hosts can supply a shared `ProcessHistory` through `history`, and pass
  `() => canvas.undo()` to `patterns/undo`'s `offerUndo` for an adjacent undo
  offer. The canvas prevents duplicate keyboard handling through preventDefault.
- `resize(id, width, height)`, `routeLine(id, points)`, `setNote(note, id)` and
  `setSection(section, id)` share that history. Pass null to remove a note or
  section. These APIs let host inspector controls edit layout without replacing
  history. Tidy positions nested frame contents together; moving a frame moves
  all descendants in one undoable operation.
- `outline` supplies nested, plain-language steps. `fields` supplies controlled
  field descriptors keyed by box ID: text, multiline, number, choice, boolean,
  search, grouped action typeahead and expression. Action options carry the
  host's value, display label and optional group; the component supports both
  browse-by-group and global search. The component draws controls and emits
  `process-field-change-request`; the host validates and updates its document.
  `renderInspector(node, container)` remains available for specialized fields
  such as a host-specific Box action browser and may return cleanup.
- `setValidation(checks)`
  marks boxes by ID or path and adds selectable, announced Checks.
  `model.validate` is authoritative when supplied: its results replace generic
  vocabulary-based graph checks rather than being added to them. This lets a
  host with kinds such as `if`, `switch` and `try` own read-back semantics
  without false positives. The exported `graphChecks` remains available if a
  host wants to compose generic checks into its own validator.
- `readback` gives `{ current, lastReadable, checks, version }`. `current` is
  null while Checks are present; `lastReadable` stays available to the host.
  A hold banner on the canvas links to Checks. `readable-projection-changed`
  only emits a version when it passes validation.
- `locked` blocks edits but retains navigation. `snap-to-grid` uses 16px units.
  Zoom is bounded to 25–200%; `setView({ x, y, zoom })` restores an authored
  viewport. `--boe-process-height` sets canvas height (default 660px).
- `heading-level` sets the inspector heading (1-6, default 2).
  `embed-mode` hides the process heading and duplicate view/last-run controls
  when the host already supplies them; the canvas, checks and editing remain.
  The palette is 248px on the left; the inspector is 320px on the right, with
  Outline, Checks, Variables, Connections and Shortcuts tabs. Below 900px
  component width, both panes use named modal drawers. `narrow` exposes that
  state. Outline links have at least 24px targets. The mobile building-block
  drawer is named "Add to the process" and focuses search when opened.
  `disable-connections` removes disconnect controls and refuses connect and
  disconnect requests. Unlabelled lines have no placeholder label; line actions
  appear on hover or keyboard focus.

## Interaction

Tab reaches boxes. Alt+arrows chooses the nearest box in that direction;
arrows nudge a selected box by 16px, Shift+arrows by 64px. N opens the
searchable building-block chooser, Ctrl+Alt+arrows adds from a directional
port, Enter focuses the selected step's editor, Delete removes, and Shift+1
fits the whole process. Ctrl/Command+A selects all; C/V/D copy, paste and
duplicate host-owned boxes. Ctrl/Command+Z and Shift+Ctrl/Command+Z undo and
redo only when local history can handle them; empty or locked history leaves
the key for the host. Escape cancels a connection or reattachment.

Background drag, Space-drag over a step, and trackpad scroll pan; Control-wheel and two-pointer pinch
zoom. The floating controls offer zoom, 100% reset, fit, snap and lock. The
208×136 overview is keyboard reachable: arrows pan and Enter fits. The
floating toolbar changes for one box, multiple boxes or one line. Selected
line endpoints can be dragged or keyboard-activated for reattachment; a hand-
routed line can be reset. Motion respects `prefers-reduced-motion`, and light
and dark consume the same foundation tokens.

Frames are projected boxes drawn behind their children; the host owns grouping
and semantic legality. Notes/sections and hand-adjusted lines are supplied as
layout data, not workflow fields. The library does not enforce any particular
workflow's save rules. When `model.validate(document, projection)` is supplied,
its read-back checks replace generic vocabulary checks. This is essential when
a host uses its own names for decisions, parallel branches or failure paths.
The exported `graphChecks` is opt-in. Checks link back to a box or host path;
the host retains its last valid workflow while the drawing is being repaired.
Select a frame to reveal its resize handle; drag it or use its arrow keys to
change size in 16px increments. Set `loopMark` on repeating frames; the library
does not guess loop semantics from a host kind. Resizing is part of local undo
history. Tidy animates box positions over 320ms unless reduced motion is set.

## Canvas controls

- Hover or select a step to reveal four ports. Drag a port to another step to
  request a connection; the target outlines and a tooltip explains whether it
  can attach. Click or keyboard-activate a port to choose a new step in that
  direction; a ghost marks its destination. Requests carry `fromSide`; lines
  can also supply `toSide`, and authored sides show pinned-end marks. Dropping
  on the highlighted edge point requests `toSide` (or `fromSide` during
  reattachment); dropping elsewhere on a box leaves that end automatic.
- Drop a building block or existing step onto a highlighted line to insert it.
  A placement ghost follows a palette drag. Drop into a frame to request
  grouping. These requests remain host-owned and
  may be refused; a refused drag returns to its original position.
- Catalog entries marked `placement: "note"` or `"section"` create reader-only
  layout annotations locally, not workflow boxes. The same grouped catalog
  powers both this palette and the flow builder; add/insert choosers exclude
  annotations that cannot form connected steps.
- Automatic routes are orthogonal and avoid boxes. Authored interior points
  remain part of layout, not the workflow document. Drag an interior segment or
  focus its Route button and use arrow keys to adjust it. Blocked routes appear
  in Checks rather than drawing through an overlapping step.
- Decision lines default to Yes/No/Route labels; explicit labels always win.
  Weighted lines may supply `weight`; dashed Try failures default to If it fails.
- A Try frame without a failure route offers **If it fails** from its selection
  toolbar. Its add request carries `routeLabel` and `dashed`; the host maps
  those to its workflow semantics. After that route exists, the action becomes
  **Add next**.
- Shift-click steps or Shift-drag empty canvas for multiple selection. Use the
  floating toolbar to line up, tidy or delete selected
  steps. Dragging selected steps moves the group, including frame descendants.
  Alignment guides and spacing labels appear during movement; snap uses 16px.
- Boxes are focusable groups with `aria-current`, not `aria-selected`. Enter or
  Space selects them. Ports keep 24px targets when the canvas is zoomed out.

## Host Bridge

```ts
canvas.load(workflow, {
  version: 12,
  positions: savedPositions,
  selectedPath: ["steps", 0],
});
canvas.connections = [{ name: "Production Box", kind: "OAuth", id: "box-prod" }];
canvas.variables = [{ name: "fileId", scope: "process", startingValue: "input.fileId" }];
canvas.processTitle = "Upload round trip";
canvas.processSummary = "8 steps in 3 sections";
canvas.lastRun = { label: "Run 27", steps: { upload: { callsPerSecond: 12, p95Ms: 412 } } };
canvas.selectedPath = ["steps", 1, "parameters"]; // deepest projected box
canvas.selectMany(["read", "save"]);
canvas.addEventListener("positions-changed", event => savePositions(event.detail.positions));
canvas.addEventListener("readable-projection-changed", event => {
  // Convert only graphs that passed model.validate.
  convertGraph(event.detail.projection, event.detail.version);
});
canvas.addEventListener("process-field-change-request", event => updateHostField(event.detail));
canvas.addEventListener("process-variable-change-request", event => updateHostVariable(event.detail));
canvas.addEventListener("connection-setup-request", () => openHostConnections());
canvas.addEventListener("selection-changed", event => selectHostPath(event.detail.path));
```

`ProcessBox.path` and `fingerprint` are supplied by the host. Position snapshots
are detached and sorted by ID, and include path/fingerprint when provided.
Selection events include `box`, `boxes`, and a detached `path`; `selectedPath`
normalizes field paths to their deepest projected box. `projection-changed`
fires once for each changed projection, with its version and current checks;
refreshing an unchanged projection does not create another version. The separate
`readable-projection-changed` event fires only for a version with no checks, so
the host can use its own `model.validate` conversion gate to keep the last
valid workflow while the drawing is being repaired. `projection-changed` remains
the raw diagnostic event, including invalid versions. Connections are
host-supplied display data, never credentials; the library requests the host's
connection setup instead of storing secrets. Variables and kind fields emit
controlled edit requests. The reference Riptide Diagram remains the visual
specification at 1440px and 390px in both themes.
