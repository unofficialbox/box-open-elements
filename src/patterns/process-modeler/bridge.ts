import type { NodePath } from "../flow-builder/model.js";
import type {
  BoxPosition,
  ProcessCheck,
  ProcessLayout,
  ProcessLoadOptions,
  ProcessPositionSnapshot,
  ProcessProjection,
} from "./model.js";

/** Detach graph presentation data without cloning the host-owned node payload. */
export function snapshotProcessProjection<N>(projection: ProcessProjection<N>): ProcessProjection<N> {
  return {
    boxes: projection.boxes.map(box => ({
      ...box,
      ...(box.path ? { path: [...box.path] } : {}),
      ...(box.localVariables ? { localVariables: box.localVariables.map(variable => ({ ...variable })) } : {}),
      ...(box.technicalDetails ? { technicalDetails: box.technicalDetails.map(detail => ({
        ...detail,
        ...(detail.segments ? { segments: detail.segments.map(segment => ({ ...segment })) } : {}),
      })) } : {}),
    })),
    lines: projection.lines.map(line => ({
      ...line,
      ...(line.points ? { points: line.points.map(point => ({ ...point })) } : {}),
    })),
  };
}

const validPosition = (position: BoxPosition): boolean =>
  Number.isFinite(position.x) && Number.isFinite(position.y) &&
  (position.width === undefined || (Number.isFinite(position.width) && position.width > 0)) &&
  (position.height === undefined || (Number.isFinite(position.height) && position.height > 0));

/** Restore only current paths with explicitly matching host fingerprints. */
export function restoreProcessPositions<N>(
  projection: ProcessProjection<N>,
  positions: ProcessLoadOptions["positions"],
): ProcessLayout {
  const savedPositions = Array.isArray(positions)
    ? Object.fromEntries(positions.filter(entry => entry.path).map(entry => [JSON.stringify(entry.path), entry]))
    : positions as Readonly<Record<string, { fingerprint?: string; position: BoxPosition }>> | undefined;
  const boxes: ProcessLayout["boxes"] = {};
  for (const box of projection.boxes) {
    if (!box.path || box.fingerprint === undefined) continue;
    const key = JSON.stringify(box.path);
    const saved = savedPositions && Object.hasOwn(savedPositions, key) ? savedPositions[key] : undefined;
    if (!saved || saved.fingerprint === undefined || saved.fingerprint !== box.fingerprint ||
        !saved.position || !validPosition(saved.position)) continue;
    Object.defineProperty(boxes, box.id, {
      value: { ...saved.position }, enumerable: true, configurable: true, writable: true,
    });
  }
  return { boxes };
}

/** Detached, ID-sorted entries; stale layout IDs and unplaced boxes are omitted. */
export function snapshotProcessPositions<N>(
  projection: ProcessProjection<N>,
  layout: ProcessLayout,
): readonly ProcessPositionSnapshot[] {
  const snapshots: ProcessPositionSnapshot[] = [];
  for (const box of projection.boxes) {
    if (!Object.hasOwn(layout.boxes, box.id)) continue;
    const position = layout.boxes[box.id];
    if (!position || !validPosition(position)) continue;
    snapshots.push({
      id: box.id,
      ...(box.path ? { path: [...box.path] } : {}),
      ...(box.fingerprint !== undefined ? { fingerprint: box.fingerprint } : {}),
      position: { ...position },
    });
  }
  return snapshots.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** Resolve a host field path to its deepest projected box, without string coercion. */
export function normalizeProcessSelectionPath<N>(
  projection: ProcessProjection<N>,
  path: NodePath | null | undefined,
): NodePath | null {
  if (path == null) return null;
  let selected: NodePath | undefined;
  for (const box of projection.boxes) {
    if (box.path && box.path.length <= path.length &&
        box.path.every((segment, index) => segment === path[index]) &&
        (!selected || box.path.length > selected.length)) selected = box.path;
  }
  return selected ? [...selected] : null;
}

const branchKinds = new Set(["decision", "choice", "weighted", "weighted-choice", "parallel", "fork"]);
const parallelKinds = new Set(["parallel", "fork"]);

/** Generic topology only. Hosts own workflow vocabulary and semantic validation. */
export function graphChecks<N>(projection: ProcessProjection<N>): readonly ProcessCheck[] {
  const boxes = new Map(projection.boxes.map(box => [box.id, box]));
  const outgoing = new Map(projection.boxes.map(box => [box.id, [] as string[]]));
  const incoming = new Map(projection.boxes.map(box => [box.id, [] as string[]]));
  for (const line of projection.lines) {
    if (!boxes.has(line.from) || !boxes.has(line.to)) continue;
    outgoing.get(line.from)!.push(line.to);
    incoming.get(line.to)!.push(line.from);
  }

  // Iterative strongly connected components keep long host graphs off the call stack.
  const visited = new Set<string>();
  const finished: string[] = [];
  for (const id of boxes.keys()) {
    if (visited.has(id)) continue;
    visited.add(id);
    const stack = [{ id, next: 0 }];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const targets = outgoing.get(top.id)!;
      if (top.next < targets.length) {
        const target = targets[top.next++];
        if (!visited.has(target)) {
          visited.add(target);
          stack.push({ id: target, next: 0 });
        }
      } else {
        finished.push(top.id);
        stack.pop();
      }
    }
  }
  visited.clear();
  const loops = new Set<string>();
  for (const id of finished.reverse()) {
    if (visited.has(id)) continue;
    const component: string[] = [];
    const stack = [id];
    visited.add(id);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      for (const source of incoming.get(current)!) {
        if (!visited.has(source)) { visited.add(source); stack.push(source); }
      }
    }
    if (component.length > 1 || outgoing.get(id)!.includes(id)) {
      for (const member of component) loops.add(member);
    }
  }

  const reachable = (start: string): Map<string, number> => {
    const distances = new Map([[start, 0]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      for (const target of outgoing.get(id)!) {
        if (!distances.has(target)) {
          distances.set(target, distances.get(id)! + 1);
          queue.push(target);
        }
      }
    }
    return distances;
  };
  const allPathsMeet = (start: string, join: string): boolean => {
    const queue = [start];
    const seen = new Set<string>();
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (id === join || seen.has(id)) continue;
      seen.add(id);
      const targets = outgoing.get(id)!;
      if (!targets.length || loops.has(id)) return false;
      queue.push(...targets);
    }
    return true;
  };

  const checks: ProcessCheck[] = [];
  for (const box of projection.boxes) {
    const add = (message: string) => checks.push({
      message, boxId: box.id, ...(box.path ? { path: [...box.path] } : {}),
    });
    if (loops.has(box.id)) add("This box is part of a loop. Remove a connection to break the loop.");
    const targets = outgoing.get(box.id)!;
    if (targets.length < 2) continue;
    if (!branchKinds.has(box.kind)) {
      add("This step leads to multiple places. Use a Decision, Weighted choice or Parallel to branch.");
      continue;
    }
    const routes = targets.map(reachable);
    const candidates = [...routes[0].keys()].filter(id =>
      id !== box.id && routes.every(route => route.has(id)));
    candidates.sort((a, b) =>
      Math.max(...routes.map(route => route.get(a)!)) - Math.max(...routes.map(route => route.get(b)!)) ||
      (a < b ? -1 : a > b ? 1 : 0));
    const join = candidates.find(id => targets.every(target => allPathsMeet(target, id)));
    if (!join) {
      add(parallelKinds.has(box.kind)
        ? "Parallel paths must meet at a Wait for all (join) box."
        : "These branch paths do not meet. Connect every path to a common next box.");
    } else if (parallelKinds.has(box.kind) && boxes.get(join)!.kind !== "join") {
      add("Parallel paths must meet at a Wait for all (join) box.");
    }
  }
  return checks;
}
