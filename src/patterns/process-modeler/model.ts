import type { FlowKind, NodePath } from "../flow-builder/model.js";

/** Plain-text technical lines supplied by the host; code lines use the mono face. */
export interface ProcessTechnicalDetail {
  text: string;
  format?: "code" | "text";
  /** Optional plain-text runs replacing text, for code embedded within prose. */
  segments?: readonly { text: string; format?: "code" | "text" }[];
}

export interface ProcessBox<N = unknown> {
  id: string;
  node: N;
  kind: string;
  title: string;
  /** Graph notes keep box identity but are not workflow steps. */
  role?: "flow" | "note";
  /** For graph notes, the visible note text (title is the fallback). */
  description?: string;
  /** Description used in Technical view; absent values fall back to description. */
  technicalDescription?: string;
  /** Structured Technical view lines; when supplied, replace technicalDescription. */
  technicalDetails?: readonly ProcessTechnicalDetail[];
  /** False when this host does not time this task kind; default task metrics remain enabled. */
  runMetrics?: boolean;
  /** Visual anatomy, independent of the host's kind identifier. */
  shape?: "task" | "gateway" | "event" | "frame";
  path?: NodePath;
  /** Host identity at this path, used to reject stale saved positions. */
  fingerprint?: string;
  /** A frame draws behind its children and connects as one box. */
  frame?: boolean;
  /** Show the loop mark in a repeating frame without inferring host semantics from its kind name. */
  loopMark?: boolean;
  parentId?: string;
  /** Present (including []) when this host supports variables local to this step/frame. */
  localVariables?: readonly ProcessLocalVariable[];
  /** Explicit opt-in to host-owned local edit requests; absent collections are readonly. */
  localVariablesEditable?: boolean;
  /** Host-owned saved output name, displayed in the variable usage summary. */
  savedResult?: string;
}
export interface ProcessLine {
  id: string;
  /** Associations attach graph notes without participating in workflow flow. */
  role?: "flow" | "association";
  from: string;
  to: string;
  label?: string;
  weight?: number;
  fromSide?: ProcessSide;
  toSide?: ProcessSide;
  dashed?: boolean;
  points?: { x: number; y: number }[];
  /** Optional last-run traffic share, between 0 and 1. */
  share?: number;
}
/** Semantic eligibility is independent of host kind names. */
export const isFlowBox = (box: ProcessBox): boolean => box.role !== "note";
export const isFlowLine = (line: ProcessLine): boolean => line.role !== "association";

export type ProcessSide = "north" | "east" | "south" | "west";
export interface ProcessConnection {
  name: string;
  kind: string;
  id?: string;
  signIn?: string;
}
export interface ProcessVariable {
  name: string;
  value?: unknown;
  description?: string;
  scope?: string;
  startingValue?: string;
  problem?: string;
}
export interface ProcessLocalVariable {
  name: string;
  startingValue?: string;
  /** Plain-text host validation; BOE does not evaluate expressions. */
  problem?: string;
}
export type ProcessLocalVariableEdit =
  | { type: 'add' }
  | { type: 'remove'; index: number; name: string }
  | { type: 'rename' | 'starting-value'; index: number; name: string; value: string };
export interface ProcessLocalVariableEditRequest {
  boxId: string;
  path?: NodePath;
  edit: ProcessLocalVariableEdit;
}
/** Host-owned variable edits; the host echoes the updated variables property. */
export type ProcessVariableEdit =
  | { type: 'add' }
  | { type: 'remove'; name: string }
  | { type: 'rename'; name: string; value: string }
  | { type: 'description'; name: string; value: string }
  | { type: 'scope'; name: string; value: 'iteration' | 'process' };
/** Host-authored, readable outline; boxId links a row to a projected step. */
export interface ProcessOutlineItem {
  title: string;
  description?: string;
  boxId?: string;
  children?: readonly ProcessOutlineItem[];
}
/** Host-authored expression presentation; BOE does not infer scope or evaluate CEL. */
export interface ProcessExpressionField {
  /** Complete ordered scope; [] suppresses legacy global-variable chips. */
  variables?: readonly { name: string; description?: string }[];
  /** Values greater than one render a textarea. */
  rows?: number;
  /** Error feedback uses ProcessField.problem and takes precedence. */
  feedback?: { message: string; tone?: 'neutral' | 'success' };
  help?: {
    summary: string;
    examples: readonly {
      expression: string;
      description: string;
      segments?: readonly { text: string; format?: 'code' | 'text' }[];
    }[];
  };
}
/** Host-supplied field values; the modeler draws controls and requests edits. */
export interface ProcessField {
  key: string;
  label: string;
  kind: "text" | "multiline" | "number" | "choice" | "boolean" | "expression" | "search" | "action" | "time" | "datetime-local";
  value: string | number | boolean;
  description?: string;
  options?: readonly { value: string; label: string; group?: string; description?: string }[];
  /** Action category order and optional headings supplied by the host catalog. */
  actionGroups?: readonly { name: string; heading?: string }[];
  /** Permit a dotted action key absent from the host catalog. The host validates it. */
  allowCustomValue?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  problem?: string;
  expression?: ProcessExpressionField;
  /** Visible rows for multiline fields. Expression fields use expression.rows. */
  rows?: number;
  /** Monospace presentation for host-owned code or structured text. */
  format?: 'code';
  /** Native constraints for number fields; the host still validates edits. */
  min?: number;
  max?: number;
  step?: number | 'any';
  /** Adjacent fields with the same key share a titled section. */
  section?: { key: string; title: string; description?: string; descriptionSegments?: ProcessTechnicalDetail['segments'] };
  /** Adjacent fields with the same key share a native disclosure. */
  disclosure?: { key: string; summary: string; open?: boolean };
  /** Adjacent fields with the same key share a row; default columns are equal. */
  row?: { key: string; leadingWidth?: number; gap?: number };
  /** A visible optional marker, independent of native required validation. */
  optional?: boolean;
  /** Plain-text type/location hint after validation feedback. */
  annotation?: string;
}
export interface ProcessPositionSnapshot {
  path?: NodePath;
  fingerprint?: string;
  id: string;
  position: BoxPosition;
}
export interface ProcessLoadOptions {
  /** Keys are JSON.stringify(path); snapshots are also accepted. Fingerprints must match. */
  positions?: Readonly<Record<string, { fingerprint?: string; position: BoxPosition }>> |
    readonly ProcessPositionSnapshot[];
  version?: string | number;
  selectedPath?: NodePath | null;
}
export interface ProcessProjection<N = unknown> {
  boxes: readonly ProcessBox<N>[];
  lines: readonly ProcessLine[];
}
export interface ProcessKind extends FlowKind {
  /** False for metadata-only kinds that must not appear in Add or insert choices. */
  addable?: boolean;
  /** Alternative terms included in palette search. */
  aliases?: readonly string[];
  /** Host kind names never dictate the reusable visual anatomy. */
  shape?: ProcessBox["shape"];
  /** Notes and sections live in layout rather than the host workflow graph. */
  placement?: "note" | "section";
}
export interface ProcessStepMetrics {
  callsPerSecond?: number;
  p95Ms?: number;
  failedShare?: number;
  /** True when the step was not measured in this run. */
  notInRun?: boolean;
}
export interface ProcessLastRun {
  label: string;
  /** Keys are projected box IDs, supplied by the host. */
  steps: Readonly<Record<string, ProcessStepMetrics>>;
}
/** A proposed host-owned connection, also used when reattaching a line. */
export interface ProcessConnectionProposal {
  readonly from: string;
  readonly to: string;
  /** Exclude this existing line from duplicate/outgoing-limit checks. */
  readonly ignoreLineId?: string;
}
export interface ProcessModel<D = unknown, N = unknown> {
  project(document: D): ProcessProjection<N>;
  /** Pure synchronous host rule: a nonempty reason rejects preview and commit.
   * Returning null permits an edit request; the host must still accept it. */
  connectionProblem?(document: D, proposal: ProcessConnectionProposal, projection: ProcessProjection<N>): string | null;
  /** Optional synchronous host transaction for Tidy/section semantics.
   * A capable host accepts or refuses; BOE does not fall back to local edits. */
  layoutEdit?(document: D, request: ProcessLayoutEditRequest, projection: ProcessProjection<N>): void;
  /** Optional host arrangement, used by Tidy up and for missing positions. */
  arrange?(projection: ProcessProjection<N>): ProcessLayout;
  /**
   * The host's workflow read-back/validation. When supplied it is authoritative:
   * generic vocabulary-based graph checks are not added on top. A host may call
   * graphChecks itself with its own kind names if it wants those checks too.
   */
  validate?(document: D, projection: ProcessProjection<N>): readonly ProcessCheck[];
}
export interface BoxPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}
export interface ProcessLayout {
  boxes: Record<string, BoxPosition>;
  notes?: { id: string; text: string; x: number; y: number }[];
  sections?: {
    id: string;
    title: string;
    description?: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  lines?: Record<string, { x: number; y: number }[]>;
}
export interface ProcessCheck {
  /** Short problem title; message supplies its explanatory detail. */
  title?: string;
  message: string;
  boxId?: string;
  path?: NodePath;
}
/** Insertion intent; explicit centers use canvas world coordinates, not top-left positions. */
export type ProcessInsertionPlacement =
  | { readonly source: 'direction'; readonly side: ProcessSide }
  | { readonly source: 'next' }
  | { readonly source: 'line'; readonly center: Readonly<{ x: number; y: number }> }
  | { readonly source: 'point'; readonly center: Readonly<{ x: number; y: number }> };
/** IDs are scoped by kind; layout notes are separate from projected boxes. */
export type ProcessSelectionItem =
  | { readonly type: 'box'; readonly id: string }
  | { readonly type: 'line'; readonly id: string }
  | { readonly type: 'note'; readonly id: string };
export interface ProcessEdit {
  type: "add" | "delete" | "duplicate" | "connect" | "disconnect" | "reattach" | "insert" | "reparent" | "reset-line" | "tidy" | "make-section" | "delete-selection" | "edit-line";
  /** One atomic mixed deletion; the host owns protected roots, descendants,
   * incident edges and notes. Unsupported hosts must leave it unapplied. */
  selection?: readonly ProcessSelectionItem[];
  boxId?: string;
  sourceId?: string;
  /** Duplicate these roots and descendants/internal edges in one host transaction.
   * Plural requests omit sourceId; unsupported hosts must refuse the whole group. */
  sourceIds?: readonly string[];
  /** One world-coordinate translation for every node in a duplicate group. */
  offset?: Readonly<{ x: number; y: number }>;
  from?: string;
  to?: string;
  lineId?: string;
  /** Host-owned branch presentation; edit-line preserves endpoints and routing. */
  label?: string;
  weight?: number;
  kind?: FlowKind;
  position?: BoxPosition;
  /** Optional for existing hosts; all built-in insertion producers supply intent. */
  placement?: ProcessInsertionPlacement;
  parentId?: string;
  fromSide?: ProcessSide;
  toSide?: ProcessSide;
  /** Optional branch presentation requested by a directional add. */
  routeLabel?: string;
  dashed?: boolean;
}
export interface ReversibleProcessEdit {
  undo(): void;
  redo(): void;
  /** The already-applied edit's layout, recorded atomically with the document. */
  layout?: ProcessLayout;
  /** Selection after acceptance; recorded with layout for undo and redo. */
  selectionIds?: readonly string[];
  /** Full mixed selection after acceptance; takes precedence over selectionIds. */
  selection?: readonly ProcessSelectionItem[];
}
/** Host applies the edit, then calls accept with its inverse and replay. */
export interface ProcessEditRequest extends ProcessEdit {
  accept(command: ReversibleProcessEdit): void;
}

/** Host-owned document/layout operation. Null sourceIds means whole-process Tidy.
 * The host owns eligibility, section membership, route cleanup and related notes. */
export interface ProcessLayoutEditRequest {
  readonly type: 'tidy' | 'make-section';
  readonly sourceIds: readonly string[] | null;
  readonly title?: string;
  /** Detached current layout; a host may use it to preserve unrelated data. */
  readonly layout: ProcessLayout;
  /** Host has already applied the document edit; full layout is required. */
  accept(command: ReversibleProcessEdit & { layout: ProcessLayout }): void;
  refuse(message?: string): void;
}

/** Host-owned immutable capture; BOE never serializes the captured graph. */
export interface ProcessClipboard {
  readonly itemCount: number;
  paste(request: ProcessPasteRequest): void;
  dispose?(): void;
}
/** Copy capture is synchronous and once-only. Unsupported hosts leave it unhandled. */
export interface ProcessCopyRequest {
  /** Full immutable selection, including notes and explicit edges. Hosts own
   * descendant/internal-edge capture and must refuse unsupported mixed capture. */
  readonly selection?: readonly ProcessSelectionItem[];
  readonly sourceIds: readonly string[];
  capture(clipboard: ProcessClipboard): void;
  refuse(message?: string): void;
}
/** Host applies one synchronous graph transaction, then accepts it once. */
export interface ProcessPasteRequest {
  readonly offset: Readonly<{ x: number; y: number }>;
  accept(command: ReversibleProcessEdit): void;
  refuse(message?: string): void;
}

export function validateProjection<N>(projection: ProcessProjection<N>): void {
  const ids = new Set<string>();
  for (const box of projection.boxes) {
    if (!box.id || ids.has(box.id))
      throw new TypeError("Process boxes need unique non-empty IDs");
    ids.add(box.id);
  }
  for (const box of projection.boxes) {
    const ancestors = new Set([box.id]);
    let parent = box.parentId;
    while (parent) {
      const frame = projection.boxes.find(
        (candidate) => candidate.id === parent,
      );
      if (!frame?.frame || ancestors.has(parent))
        throw new TypeError("Frame parents must exist and cannot form a cycle");
      ancestors.add(parent);
      parent = frame.parentId;
    }
  }
  const lines = new Set<string>();
  for (const line of projection.lines) {
    if (
      !line.id ||
      lines.has(line.id) ||
      !ids.has(line.from) ||
      !ids.has(line.to)
    )
      throw new TypeError(
        "Process lines need unique IDs and existing endpoints",
      );
    lines.add(line.id);
  }
}

/** Deterministic fallback, preserving host-authored positions. */
export function completeLayout<N>(
  projection: ProcessProjection<N>,
  layout: ProcessLayout,
): ProcessLayout {
  const boxes = { ...layout.boxes };
  const sizes = new Map<string, { width: number; height: number }>();
  const measure = (box: ProcessBox<N>): { width: number; height: number } => {
    const children = projection.boxes
      .filter((child) => child.parentId === box.id)
      .map(measure);
    const size = {
      width: Math.max(
        box.frame || box.shape === "frame" ? 320 : box.shape === "gateway" || box.shape === "event" ? 56 : box.role === "note" ? 208 : 224,
        ...children.map((child) => child.width + 40),
      ),
      height: box.frame
        ? Math.max(
            180,
            64 + children.reduce((sum, child) => sum + child.height + 24, 0),
          )
        : box.shape === "gateway" || box.shape === "event" ? 56 : 64,
    };
    sizes.set(box.id, size);
    return size;
  };
  const roots = projection.boxes.filter((box) => !box.parentId);
  roots.forEach(measure);
  const place = (
    siblings: readonly ProcessBox<N>[],
    x: number,
    top: number,
  ) => {
    let y = top;
    for (const box of siblings) {
      const size = sizes.get(box.id)!;
      if (!boxes[box.id]) {
        if (box.role === "note") {
          // Flow ranks are already placed; unplaced graph notes need free space
          // regardless of their order in the projection.
          const ancestors = new Set<string>();
          for (let parent = box.parentId; parent; parent = projection.boxes.find(b => b.id === parent)?.parentId) ancestors.add(parent);
          let overlaps: BoxPosition[];
          do {
            overlaps = Object.entries(boxes).filter(([id]) => !ancestors.has(id)).map(([, p]) => p).filter(p => x < p.x + (p.width ?? 224) && x + size.width > p.x && y < p.y + (p.height ?? 64) && y + size.height > p.y);
            if (overlaps.length) y = Math.max(...overlaps.map(p => p.y + (p.height ?? 64))) + 60;
          } while (overlaps.length);
          boxes[box.id] = { x, y, width: size.width };
        } else boxes[box.id] = { x, y, ...size };
      }
      const position = boxes[box.id];
      place(
        projection.boxes.filter((child) => child.parentId === box.id),
        position.x + 20,
        position.y + 64,
      );
      y += (position.height ?? size.height) + 60;
    }
  };
  place([...roots.filter(box => box.role !== "note"), ...roots.filter(box => box.role === "note")], 40, 40);
  return { ...layout, boxes };
}

/** Bounded history shared by layout edits and host-accepted document commands. */
export class ProcessHistory {
  private replayingInternal = false;
  private past: ReversibleProcessEdit[] = [];
  private future: ReversibleProcessEdit[] = [];
  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }
  get replaying(): boolean {
    return this.replayingInternal;
  }
  record(command: ReversibleProcessEdit): void {
    this.past.push(command);
    if (this.past.length > 100) this.past.shift();
    this.future = [];
  }
  undo(): void {
    const command = this.past.at(-1);
    if (!command) return;
    this.replayingInternal = true;
    try {
      command.undo();
    } finally {
      this.replayingInternal = false;
    }
    this.past.pop();
    this.future.push(command);
  }
  redo(): void {
    const command = this.future.at(-1);
    if (!command) return;
    this.replayingInternal = true;
    try {
      command.redo();
    } finally {
      this.replayingInternal = false;
    }
    this.future.pop();
    this.past.push(command);
  }
  clear(): void {
    this.past = [];
    this.future = [];
  }
}
