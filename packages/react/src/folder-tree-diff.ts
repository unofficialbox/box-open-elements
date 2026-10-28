import { FolderTreeDiff as FolderTreeDiffRef } from "@unofficialbox/box-open-elements/folder-tree-diff";
import type { FolderTreeDiffNode } from "@unofficialbox/box-open-elements/folder-tree-diff";
import { createWebComponent } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";
import { folderTreeEvents, folderTreeProperties, type FolderTreeProps } from "./folder-tree.js";
export type { FolderTreeDiffRef, FolderTreeDiffNode };
export type FolderTreeDiffProps = Omit<FolderTreeProps, "nodes" | "onSelectedChanged" | "onItemActivated"> & {
  nodes?: FolderTreeDiffNode[];
  mode?: "unified" | "side-by-side";
  leftLabel?: string;
  rightLabel?: string;
  changesOnly?: boolean;
  onSelectedChanged?: CustomEventHandler<FolderTreeDiffRef, { id:string; node:FolderTreeDiffNode; selectedIds:string[] }>;
  onItemActivated?: CustomEventHandler<FolderTreeDiffRef, { id:string; node:FolderTreeDiffNode }>;
  onDifferenceNavigated?: CustomEventHandler<FolderTreeDiffRef, { id:string; node:FolderTreeDiffNode }>;
  onChangesOnlyChanged?: CustomEventHandler<FolderTreeDiffRef, { changesOnly:boolean }>;
};
const properties = [...folderTreeProperties, "mode", "leftLabel", "rightLabel", "changesOnly"] as const;
export const FolderTreeDiff = createWebComponent<FolderTreeDiffRef, FolderTreeDiffProps>({
  tagName:FolderTreeDiffRef.tagName, displayName:"FolderTreeDiff", propertyNames:properties,
  events:[...folderTreeEvents, { propName:"onDifferenceNavigated", eventName:"difference-navigated" }, { propName:"onChangesOnlyChanged", eventName:"changes-only-changed" }],
  sync: (element, props) => { for (const key of properties) if (props[key] !== undefined) Object.assign(element, { [key]:props[key] }); },
});
