import type { ReactNode } from "react";
import { FolderTree as FolderTreeRef } from "@unofficialbox/box-open-elements/folder-tree";
import type { FolderTreeNode, FolderTreeNodeDetail, FolderTreeExpandedDetail, FolderTreeSelectedDetail } from "@unofficialbox/box-open-elements/folder-tree";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";
export type { FolderTreeRef, FolderTreeNode };
export type FolderTreeProps = WebComponentProps & {
  children?: ReactNode;
  nodes?: FolderTreeNode[];
  expandedIds?: string[];
  selectedIds?: string[];
  activeId?: string | null;
  label?: string;
  filter?: string;
  loading?: boolean;
  partial?: boolean;
  unavailable?: boolean;
  selectionDisabled?: boolean;
  onExpandedChanged?: CustomEventHandler<FolderTreeRef, FolderTreeExpandedDetail>;
  onSelectedChanged?: CustomEventHandler<FolderTreeRef, FolderTreeSelectedDetail>;
  onActiveChanged?: CustomEventHandler<FolderTreeRef, FolderTreeNodeDetail>;
  onLoadChildren?: CustomEventHandler<FolderTreeRef, FolderTreeNodeDetail>;
  onItemActivated?: CustomEventHandler<FolderTreeRef, FolderTreeNodeDetail>;
};
export const folderTreeProperties = ["nodes", "expandedIds", "selectedIds", "activeId", "label", "filter", "loading", "partial", "unavailable", "selectionDisabled"] as const;
export const folderTreeEvents = [
  { propName:"onExpandedChanged", eventName:"expanded-changed" },
  { propName:"onSelectedChanged", eventName:"selected-changed" },
  { propName:"onActiveChanged", eventName:"active-changed" },
  { propName:"onLoadChildren", eventName:"load-children" },
  { propName:"onItemActivated", eventName:"item-activated" },
] as const;
export const FolderTree = createWebComponent<FolderTreeRef, FolderTreeProps>({
  tagName:FolderTreeRef.tagName, displayName:"FolderTree", propertyNames:folderTreeProperties, events:folderTreeEvents,
  sync: (element, props) => {
    for (const key of folderTreeProperties) if (props[key] !== undefined) Object.assign(element, { [key]:props[key] });
  },
});
