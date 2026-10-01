import type { FlowKind, NodePath } from "../flow-builder/model.js";

export interface ProcessBox<N = unknown> {
  id: string;
  node: N;
  kind: string;
  title: string;
  description?: string;
  path?: NodePath;
  /** Host identity at this path, used to reject stale saved positions. */
  fingerprint?: string;
  /** A frame draws behind its children and connects as one box. */
  frame?: boolean;
  parentId?: string;
}
export interface ProcessLine {
  id: string;
  from: string;
  to: string;
  label?: string;
  weight?: number;
  fromSide?: ProcessSide;
  toSide?: ProcessSide;
  dashed?: boolean;
  points?: { x: number; y: number }[];
}
export type ProcessSide = "north" | "east" | "south" | "west";
export interface ProcessConnection {
  name: string;
  kind: string;
  id?: string;
}
export interface ProcessVariable {
  name: string;
  value?: unknown;
  description?: string;
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
export interface ProcessModel<D = unknown, N = unknown> {
  project(document: D): ProcessProjection<N>;
  /** Optional host arrangement, used by Tidy up and for missing positions. */
  arrange?(projection: ProcessProjection<N>): ProcessLayout;
  /** Host-specific semantics supplement the generic free-graph checks. */
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
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  lines?: Record<string, { x: number; y: number }[]>;
}
export interface ProcessCheck {
  message: string;
  boxId?: string;
  path?: NodePath;
}
export interface ProcessEdit {
  type: "add" | "delete" | "connect" | "disconnect" | "insert" | "reparent";
  boxId?: string;
  from?: string;
  to?: string;
  lineId?: string;
  kind?: FlowKind;
  position?: BoxPosition;
  parentId?: string;
  fromSide?: ProcessSide;
  toSide?: ProcessSide;
}
export interface ReversibleProcessEdit {
  undo(): void;
  redo(): void;
  /** The already-applied edit's layout, recorded atomically with the document. */
  layout?: ProcessLayout;
}
/** Host applies the edit, then calls accept with its inverse and replay. */
export interface ProcessEditRequest extends ProcessEdit {
  accept(command: ReversibleProcessEdit): void;
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
        box.frame ? 320 : 220,
        ...children.map((child) => child.width + 40),
      ),
      height: box.frame
        ? Math.max(
            180,
            64 + children.reduce((sum, child) => sum + child.height + 24, 0),
          )
        : 96,
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
      boxes[box.id] ??= { x, y, ...size };
      const position = boxes[box.id];
      place(
        projection.boxes.filter((child) => child.parentId === box.id),
        position.x + 20,
        position.y + 64,
      );
      y += (position.height ?? size.height) + 60;
    }
  };
  place(roots, 40, 40);
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
