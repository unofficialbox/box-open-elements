/** Provider-neutral structure. IDs are unique and parent links must be acyclic. */
export interface FolderTreeNode {
  id: string;
  parentId?: string;
  name: string;
  type: "folder" | "file" | "web_link" | "other";
  hasChildren?: boolean;
  childCount?: number;
  description?: string;
  status?: string;
  metadata?: string;
  /** Unloaded means no request yet; partial means more children may exist. */
  loadState?: "unloaded" | "loading" | "loaded" | "partial" | "error" | "unavailable";
}
export interface FolderTreeDiffNode extends FolderTreeNode {
  path: string;
  status: "equal" | "changed" | "added" | "removed" | "moved";
  before?: { name?: string; path?: string; metadata?: Record<string, unknown> };
  after?: { name?: string; path?: string; metadata?: Record<string, unknown> };
  hasChangedDescendants?: boolean;
}
export interface FolderTreeNodeDetail { id: string; node: FolderTreeNode; }
export interface FolderTreeExpandedDetail extends FolderTreeNodeDetail { expanded: boolean; expandedIds: string[]; }
export interface FolderTreeSelectedDetail extends FolderTreeNodeDetail { selectedIds: string[]; }
