/** Node emphasis in the version tree: majors are milestones, merges close branches. */
export type VersionKind = "major" | "minor" | "merge" | "draft";

/** Lifecycle status; rendered as tone on both projections. */
export type VersionStatus = "current" | "executed" | "superseded" | "abandoned";

export interface VersionActor {
  name: string;
  initials?: string;
}

/**
 * One version in a branch/merge history. `parents` carries the topology the
 * way git does: a root has none, a branch point has many children, and a
 * merge node lists more than one parent. Hosts list nodes in creation order —
 * that order (not timestamps) breaks topological ties.
 */
export interface VersionNode {
  id: string;
  /** Short display name: "v2.0", "Redline r2". */
  label: string;
  /** Ids of the versions this one was derived from. Empty/absent = root. */
  parents?: string[];
  kind?: VersionKind;
  status?: VersionStatus;
  actor?: VersionActor;
  /** ISO timestamp; display only — `parents` defines the topology. */
  timestamp?: string;
  /** One-line description under the label. */
  note?: string;
}

/** Detail payload for `compare-requested`; `baseId` is the older side. */
export interface VersionCompareDetail {
  baseId: string;
  targetId: string;
}

const KINDS = new Set<VersionKind>(["major", "minor", "merge", "draft"]);

const STATUSES = new Set<VersionStatus>(["current", "executed", "superseded", "abandoned"]);

export const resolveVersionKind = (value: string | null | undefined): VersionKind =>
  value && KINDS.has(value as VersionKind) ? (value as VersionKind) : "minor";

export const resolveVersionStatus = (
  value: string | null | undefined,
): VersionStatus | null =>
  value && STATUSES.has(value as VersionStatus) ? (value as VersionStatus) : null;

/** Attribute payloads are author input — validate every record, not just the array. */
export const isVersionNodeRecord = (value: unknown): value is VersionNode => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string" || node.id.length === 0 || typeof node.label !== "string") {
    return false;
  }
  if (node.parents !== undefined) {
    if (!Array.isArray(node.parents)) {
      return false;
    }
    for (const parent of node.parents) {
      if (typeof parent !== "string") {
        return false;
      }
    }
  }
  for (const field of ["kind", "status", "timestamp", "note"] as const) {
    if (node[field] !== undefined && typeof node[field] !== "string") {
      return false;
    }
  }
  if (node.actor !== undefined) {
    const actor = node.actor as Record<string, unknown> | null;
    if (typeof actor !== "object" || actor === null || typeof actor.name !== "string") {
      return false;
    }
    if (actor.initials !== undefined && typeof actor.initials !== "string") {
      return false;
    }
  }
  return true;
};
