import type { FolderTreeNode } from "./types.js";
export interface TreeRow { node: FolderTreeNode; level: number; position: number; size: number; branch: boolean; expanded: boolean; }
/** Indexed once per snapshot; closed descendants never become DOM rows. */
export function indexTree(nodes: readonly FolderTreeNode[]) {
  const byId = new Map<string, FolderTreeNode>();
  for (const node of nodes) {
    if (byId.has(node.id)) throw new TypeError(`Duplicate folder tree ID: ${node.id}`);
    byId.set(node.id, node);
  }
  const children = new Map<string | undefined, FolderTreeNode[]>();
  for (const node of nodes) {
    const parent = node.parentId && byId.has(node.parentId) ? node.parentId : undefined;
    const siblings = children.get(parent) ?? [];
    siblings.push(node); children.set(parent, siblings);
  }
  // Iterative cycle validation also handles snapshots deeper than the JS call stack.
  const done = new Set<string>();
  for (const node of nodes) {
    const path = new Set<string>();
    let current: FolderTreeNode | undefined = node;
    while (current && !done.has(current.id)) {
      if (path.has(current.id)) throw new TypeError(`Cyclic folder tree ID: ${current.id}`);
      path.add(current.id); current = byId.get(current.parentId ?? "");
    }
    for (const id of path) done.add(id);
  }
  return { byId, children };
}
export type TreeIndex = ReturnType<typeof indexTree>;
export function ancestorIds(index: TreeIndex, ids: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const id of ids) {
    let node = index.byId.get(id);
    while (node && !result.has(node.id)) { result.add(node.id); node = index.byId.get(node.parentId ?? ""); }
  }
  return result;
}
export function visibleRows(index: TreeIndex, expanded: Set<string>, included?: Set<string>): TreeRow[] {
  const rows: TreeRow[] = [];
  const work: Array<{ node: FolderTreeNode; level: number; position: number; size: number }> = [];
  const push = (nodes: FolderTreeNode[], level: number) => {
    const siblings = included ? nodes.filter(node => included.has(node.id)) : nodes;
    for (let i = siblings.length - 1; i >= 0; i--) work.push({ node: siblings[i]!, level, position: i + 1, size: siblings.length });
  };
  push(index.children.get(undefined) ?? [], 1);
  while (work.length) {
    const entry = work.pop()!;
    const children = index.children.get(entry.node.id) ?? [];
    const hasChildren = children.length > 0 || Boolean(entry.node.hasChildren) || (entry.node.childCount ?? 0) > 0;
    const mayLoadChildren = entry.node.loadState !== "loaded" &&
      (children.length === 0 || Boolean(entry.node.loadState));
    const branch = hasChildren && (!included || children.some(node => included.has(node.id)) || mayLoadChildren);
    const open = branch && expanded.has(entry.node.id);
    rows.push({ ...entry, branch, expanded: open });
    if (open) push(children, entry.level + 1);
  }
  return rows;
}
