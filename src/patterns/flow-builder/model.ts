/**
 * The least the flow builder needs from a node. Hosts keep their own
 * document shape; a {@link FlowModel} tells the builder how to read it.
 */
export interface FlowNodeBase { kind: string; }

/** The document shape the default model reads. */
export interface FlowNode extends FlowNodeBase {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  body?: FlowNode[];
  branches?: FlowBranch[];
}
export interface FlowBranch { label: string; body: FlowNode[]; }

/** One list of steps nested under a node. */
export interface FlowChildList {
  /** A branch label. Unlabeled lists render as the node's inline body; labeled lists render as branch columns. */
  label?: string;
  /** The host's own array. The builder splices new steps into it. */
  list: FlowNodeBase[];
  /** Show a remove control on this branch; the builder emits `branch-remove-request`. */
  removable?: boolean;
}

/**
 * How the builder reads a host document. Every traversal, title and insert
 * label goes through the model, so hosts pass their own nodes — identity
 * (selection, undo, validation paths) is preserved.
 */
export interface FlowModel<N extends FlowNodeBase = FlowNodeBase> {
  /** Nested lists under `node`, in display order. */
  children(node: N): FlowChildList[];
  /** A distinct name for the node; falls back to its kind's label. */
  title?(node: N): string | undefined;
  /** One sentence about what the node does at run time; falls back to its kind's description. */
  description?(node: N): string | undefined;
  /** A short status line shown on the card. */
  status?(node: N): string | undefined;
  /** When it returns a label, the node's branches get an add control; the builder emits `branch-add-request`. */
  addBranchLabel?(node: N): string | undefined;
}

/** Reads {@link FlowNode}: `body` renders inline and `branches` render as labeled columns. */
export const defaultFlowModel: FlowModel<FlowNode> = {
  children: node => [
    ...(node.body ? [{ list: node.body }] : []),
    ...(node.branches ?? []).map(branch => ({ label: branch.label, list: branch.body })),
  ],
  title: node => node.title,
  description: node => node.description,
  status: node => node.status,
};

export interface FlowKind<N extends FlowNodeBase = FlowNodeBase> {
  kind: string;
  label: string;
  description: string;
  group?: string;
  /** Supply an authored SVG node (for example from a named glyph import). */
  icon?: () => Node;
  /**
   * Icon color. `accent` (the default) uses the brand color; `neutral` uses
   * secondary text, so a host can reserve the accent for its primary object.
   */
  tone?: "accent" | "neutral";
  create(): N;
}
export interface FlowInsertDetail { list: FlowNodeBase[]; index: number; label: string; }
export interface FlowBranchRequestDetail {
  node: FlowNodeBase;
  /** The branch's position among the node's labeled lists (remove requests only). */
  index?: number;
  /** The branch's own list (remove requests only). */
  list?: FlowNodeBase[];
}
export type NodePath = readonly (string | number)[];

export const nodeTitle = (node: FlowNodeBase, catalog: readonly FlowKind[] = [], model: FlowModel<FlowNodeBase> = defaultFlowModel): string =>
  model.title?.(node) || catalog.find(kind => kind.kind === node.kind)?.label || "Step";

export const nodeDescription = (node: FlowNodeBase, catalog: readonly FlowKind[] = [], model: FlowModel<FlowNodeBase> = defaultFlowModel): string =>
  model.description?.(node) || catalog.find(kind => kind.kind === node.kind)?.description || "";

export function cardLabel(node: FlowNodeBase, catalog: readonly FlowKind[] = [], invalid = false, model: FlowModel<FlowNodeBase> = defaultFlowModel): string {
  const kind = catalog.find(entry => entry.kind === node.kind);
  const title = nodeTitle(node, catalog, model);
  return [title, kind?.label !== title ? kind?.label : "", nodeDescription(node, catalog, model), model.status?.(node), invalid ? "Needs attention" : ""].filter(Boolean).join(". ");
}

export function insertLabel(list: readonly FlowNodeBase[], index: number, where = "in the flow", catalog: readonly FlowKind[] = [], model: FlowModel<FlowNodeBase> = defaultFlowModel): string {
  const title = (node: FlowNodeBase) => nodeTitle(node, catalog, model);
  if (!list.length) return `Add the first step ${where}`;
  if (index === 0) return `Insert before ${title(list[0])} ${where}`;
  if (index >= list.length) return `Insert after ${title(list[list.length - 1])} ${where}`;
  return `Insert between ${title(list[index - 1])} and ${title(list[index])} ${where}`;
}

/** Return the deepest node on a validation path, including paths ending in a field. */
export function nodeAtPath(document: unknown, path: NodePath): FlowNodeBase | null {
  let current: unknown = document;
  let result: FlowNodeBase | null = null;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, segment)) break;
    current = (current as Record<string | number, unknown>)[segment];
    if (current && typeof current === "object" && "kind" in current && typeof current.kind === "string") result = current as FlowNodeBase;
  }
  return result;
}
