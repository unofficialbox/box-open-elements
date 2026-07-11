import type { ExplorerBreadcrumb, ExplorerFolder } from "../types.js";

export interface ExplorerNavigationControllerOptions {
  rootFolderId: string;
}

export interface ExplorerNavigationState {
  breadcrumbs: ExplorerBreadcrumb[];
  currentFolder: ExplorerFolder | null;
  currentFolderId: string;
}

export interface ExplorerNavigationEvents {
  breadcrumbsChanged: { breadcrumbs: ExplorerBreadcrumb[] };
  folderChanged: { folder: ExplorerFolder };
  folderLoaded: { folder: ExplorerFolder };
}
