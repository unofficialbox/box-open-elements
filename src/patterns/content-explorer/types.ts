export type ExplorerItemType = "file" | "folder" | "web_link";

export interface ExplorerItem {
  id: string;
  name: string;
  type: ExplorerItemType;
}

export type ExplorerSelectionMode = "single" | "multiple";
