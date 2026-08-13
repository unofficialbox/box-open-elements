/**
 * Node roles in a provenance chain. Open vocabulary — `clause`, `template`,
 * and `contract` are the CLM conventions, but hosts add their own kinds
 * without a schema change.
 */
export type LineageKind = string;

/** How far a node's text drifted from the parent it derives from. */
export type LineageDeviation = "none" | "minor" | "major";

/**
 * One typed derivation link. Unlike the versions pattern (where a parent is
 * just an id), lineage links carry the comparison payload: how severely the
 * child deviates from that parent, and an optional one-line summary.
 */
export interface LineageParentLink {
  id: string;
  deviation?: LineageDeviation;
  /** One-line description of the drift, e.g. "liability cap reworded". */
  note?: string;
}

/**
 * One node in the provenance DAG: a library clause, a template that embeds
 * it, or an executed contract containing the final text. `parents` carries
 * the derivation topology; a root (the source clause) has none.
 */
export interface LineageNode {
  id: string;
  /** Short display name: "Clause 4.2 v5", "Template 2026", "MSA_Acme §4.2". */
  label: string;
  kind?: LineageKind;
  parents?: LineageParentLink[];
  /** Reference to the underlying record, for hosts to resolve on selection. */
  entityRef?: { id: string; label?: string };
  actor?: { name: string; initials?: string };
  /** ISO timestamp; display only — `parents` defines the topology. */
  timestamp?: string;
  note?: string;
}

/** Detail payload for `edge-selected`; feeds the diff viewer's base/target pair. */
export interface LineageEdgeDetail {
  parent: LineageNode;
  child: LineageNode;
  deviation: LineageDeviation;
  note?: string;
}

const DEVIATIONS = new Set<LineageDeviation>(["none", "minor", "major"]);

export const resolveLineageDeviation = (
  value: string | null | undefined,
): LineageDeviation => (value && DEVIATIONS.has(value as LineageDeviation) ? (value as LineageDeviation) : "none");

/** Attribute payloads are author input — validate every record, not just the array. */
export const isLineageNodeRecord = (value: unknown): value is LineageNode => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string" || node.id.length === 0 || typeof node.label !== "string") {
    return false;
  }
  for (const field of ["kind", "timestamp", "note"] as const) {
    if (node[field] !== undefined && typeof node[field] !== "string") {
      return false;
    }
  }
  if (node.parents !== undefined) {
    if (!Array.isArray(node.parents)) {
      return false;
    }
    for (const entry of node.parents) {
      const link = entry as Record<string, unknown> | null;
      if (
        typeof link !== "object" ||
        link === null ||
        typeof link.id !== "string" ||
        link.id.length === 0 ||
        (link.deviation !== undefined && typeof link.deviation !== "string") ||
        (link.note !== undefined && typeof link.note !== "string")
      ) {
        return false;
      }
    }
  }
  if (node.entityRef !== undefined) {
    const ref = node.entityRef as Record<string, unknown> | null;
    if (typeof ref !== "object" || ref === null || typeof ref.id !== "string") {
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
