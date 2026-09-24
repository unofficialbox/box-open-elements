export interface FlowNode {
  id?: string;
  kind: string;
  title?: string;
  description?: string;
  status?: string;
  body?: FlowNode[];
  branches?: FlowBranch[];
}
export interface FlowBranch { label: string; body: FlowNode[]; }
export interface FlowKind {
  kind: string;
  label: string;
  description: string;
  group?: string;
  /** Supply an authored SVG node (for example from a named glyph import). */
  icon?: () => Node;
  create(): FlowNode;
}
export interface FlowInsertDetail { list: FlowNode[]; index: number; label: string; }
export type NodePath = readonly (string | number)[];
export const nodeTitle = (node: FlowNode, catalog: readonly FlowKind[] = []): string =>
  node.title || catalog.find(kind => kind.kind === node.kind)?.label || "Step";

export function cardLabel(node: FlowNode, catalog: readonly FlowKind[] = [], invalid = false): string {
  const kind = catalog.find(entry => entry.kind === node.kind);
  const title = nodeTitle(node, catalog);
  return [title, kind?.label !== title ? kind?.label : "", node.description || kind?.description, node.status, invalid ? "Needs attention" : ""].filter(Boolean).join(". ");
}

export function insertLabel(list: readonly FlowNode[], index: number, where = "in the flow", catalog: readonly FlowKind[] = []): string {
  if (!list.length) return `Add the first step ${where}`;
  if (index === 0) return `Insert before ${nodeTitle(list[0], catalog)} ${where}`;
  if (index >= list.length) return `Insert after ${nodeTitle(list[list.length - 1], catalog)} ${where}`;
  return `Insert between ${nodeTitle(list[index - 1], catalog)} and ${nodeTitle(list[index], catalog)} ${where}`;
}

/** Return the deepest node on a validation path, including paths ending in a field. */
export function nodeAtPath(document: unknown, path: NodePath): FlowNode | null {
  let current: unknown = document;
  let result: FlowNode | null = null;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, segment)) break;
    current = (current as Record<string | number, unknown>)[segment];
    if (current && typeof current === "object" && "kind" in current && typeof current.kind === "string") result = current as FlowNode;
  }
  return result;
}
