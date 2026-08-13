import type { VersionNode } from "./types.js";

export interface VersionGraphPlacement {
  id: string;
  /** Horizontal column, 0 = trunk. */
  lane: number;
  /** Vertical position, 0 = newest. */
  row: number;
}

export interface VersionGraphEdge {
  /** Parent (older) node. */
  fromId: string;
  /** Child (newer) node. */
  toId: string;
  fromLane: number;
  fromRow: number;
  toLane: number;
  toRow: number;
}

export interface VersionGraphLayout {
  /** One placement per surviving node, in display order (newest first). */
  placements: VersionGraphPlacement[];
  edges: VersionGraphEdge[];
  laneCount: number;
  rowCount: number;
  /** Degradations: duplicate ids, unknown parents, cycles. Never throws. */
  warnings: string[];
}

/**
 * Git-network layout as a pure function: topological order (host input order
 * breaks ties), first child continues its parent's lane, later siblings
 * branch to the lowest free lane, and a merge releases the lanes of the
 * branches it closes so the next branch can reuse them. Malformed topology
 * degrades instead of throwing — duplicate ids are dropped, unknown parents
 * are ignored, and cycle members are appended in input order — with each
 * degradation reported in `warnings`.
 */
export const computeVersionGraphLayout = (nodes: readonly VersionNode[]): VersionGraphLayout => {
  const warnings: string[] = [];

  const byId = new Map<string, VersionNode>();
  const ordered: VersionNode[] = [];
  for (const node of nodes) {
    if (byId.has(node.id)) {
      warnings.push(`Duplicate version id dropped: ${node.id}`);
      continue;
    }
    byId.set(node.id, node);
    ordered.push(node);
  }

  const parentsOf = new Map<string, string[]>();
  for (const node of ordered) {
    const known: string[] = [];
    const seen = new Set<string>();
    for (const parentId of node.parents ?? []) {
      if (parentId === node.id) {
        warnings.push(`Self parent ignored: ${node.id}`);
        continue;
      }
      if (!byId.has(parentId)) {
        warnings.push(`Unknown parent ignored: ${node.id} -> ${parentId}`);
        continue;
      }
      if (seen.has(parentId)) {
        continue;
      }
      seen.add(parentId);
      known.push(parentId);
    }
    parentsOf.set(node.id, known);
  }

  // Kahn's topological sort, oldest first; ready nodes resolve in input order.
  const inputIndex = new Map<string, number>(ordered.map((node, index) => [node.id, index]));
  const remainingParents = new Map<string, number>();
  const childrenOf = new Map<string, string[]>();
  for (const node of ordered) {
    const parents = parentsOf.get(node.id)!;
    remainingParents.set(node.id, parents.length);
    for (const parentId of parents) {
      const children = childrenOf.get(parentId) ?? [];
      children.push(node.id);
      childrenOf.set(parentId, children);
    }
  }

  const ready: string[] = ordered
    .filter(node => remainingParents.get(node.id) === 0)
    .map(node => node.id);
  const topo: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift()!;
    topo.push(id);
    for (const childId of childrenOf.get(id) ?? []) {
      const left = remainingParents.get(childId)! - 1;
      remainingParents.set(childId, left);
      if (left === 0) {
        const at = ready.findIndex(other => inputIndex.get(other)! > inputIndex.get(childId)!);
        if (at === -1) {
          ready.push(childId);
        } else {
          ready.splice(at, 0, childId);
        }
      }
    }
  }
  if (topo.length < ordered.length) {
    const placed = new Set(topo);
    for (const node of ordered) {
      if (!placed.has(node.id)) {
        warnings.push(`Cycle detected; appended in input order: ${node.id}`);
        topo.push(node.id);
      }
    }
  }

  // Lane allocation in topological (oldest-first) order.
  const laneOf = new Map<string, number>();
  const laneTips = new Map<number, string>();
  const freeLanes: number[] = [];
  let laneCount = 0;
  const takeLane = (): number => {
    if (freeLanes.length > 0) {
      freeLanes.sort((a, b) => a - b);
      return freeLanes.shift()!;
    }
    laneCount += 1;
    return laneCount - 1;
  };

  for (const id of topo) {
    const parents = parentsOf.get(id)!;
    let lane: number | null = null;
    for (const parentId of parents) {
      const parentLane = laneOf.get(parentId);
      if (parentLane !== undefined && laneTips.get(parentLane) === parentId) {
        lane = parentLane;
        break;
      }
    }
    if (lane === null) {
      lane = takeLane();
    }
    laneOf.set(id, lane);
    laneTips.set(lane, id);

    // A merge closes the branches it consumes: release their lanes.
    for (const parentId of parents) {
      const parentLane = laneOf.get(parentId);
      if (parentLane !== undefined && parentLane !== lane && laneTips.get(parentLane) === parentId) {
        laneTips.delete(parentLane);
        freeLanes.push(parentLane);
      }
    }
  }

  // Display rows run newest first, like a git log.
  const rowCount = topo.length;
  const rowOf = new Map<string, number>(topo.map((id, index) => [id, rowCount - 1 - index]));

  const placements: VersionGraphPlacement[] = [...topo]
    .reverse()
    .map(id => ({ id, lane: laneOf.get(id)!, row: rowOf.get(id)! }));

  const edges: VersionGraphEdge[] = [];
  for (const id of topo) {
    for (const parentId of parentsOf.get(id)!) {
      edges.push({
        fromId: parentId,
        toId: id,
        fromLane: laneOf.get(parentId)!,
        fromRow: rowOf.get(parentId)!,
        toLane: laneOf.get(id)!,
        toRow: rowOf.get(id)!,
      });
    }
  }

  return { placements, edges, laneCount: Math.max(laneCount, 1), rowCount, warnings };
};

/**
 * The shared display order for both projections: topological, newest first.
 * The list and the graph agree by construction because both derive their
 * order from the same layout.
 */
export const orderVersionsForDisplay = (nodes: readonly VersionNode[]): VersionNode[] => {
  // Keep the first record per id — the same resolution the layout applies —
  // so the returned records match the topology the layout placed.
  const byId = new Map<string, VersionNode>();
  for (const node of nodes) {
    if (!byId.has(node.id)) {
      byId.set(node.id, node);
    }
  }
  return computeVersionGraphLayout(nodes).placements.map(placement => byId.get(placement.id)!);
};
