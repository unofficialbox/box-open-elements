import { Controller } from "../../../core/controller.js";
import type { ExplorerBreadcrumb, ExplorerFolder, ExplorerTransportResult } from "../types.js";
import type {
  ExplorerNavigationControllerOptions,
  ExplorerNavigationEvents,
  ExplorerNavigationState,
} from "./types.js";

const createInitialState = (
  options: ExplorerNavigationControllerOptions,
): ExplorerNavigationState => ({
  breadcrumbs: [],
  currentFolder: null,
  currentFolderId: options.rootFolderId,
});

export class ExplorerNavigationController extends Controller<
  ExplorerNavigationState,
  ExplorerNavigationEvents
> {
  private readonly options: ExplorerNavigationControllerOptions;

  constructor(options: ExplorerNavigationControllerOptions) {
    super(createInitialState(options));
    this.options = options;
  }

  reset(): void {
    this.setState(createInitialState(this.options));
    this.emit("breadcrumbsChanged", { breadcrumbs: this.state.breadcrumbs });
  }

  navigateTo(folderId: string): ExplorerFolder | null {
    if (folderId === this.state.currentFolderId) {
      return null;
    }

    // Navigating to a crumb already in the trail truncates back to it (a
    // breadcrumb is a path, so an ancestor click must drop its descendants);
    // navigating anywhere else appends a provisional crumb that the loaded
    // folder's real metadata replaces via applyLoadedFolder.
    const existingIndex = this.state.breadcrumbs.findIndex(crumb => crumb.id === folderId);
    const nextFolder: ExplorerFolder =
      existingIndex >= 0
        ? { ...this.state.breadcrumbs[existingIndex], type: "folder" }
        : { id: folderId, name: folderId, type: "folder" };
    const nextBreadcrumbs: ExplorerBreadcrumb[] =
      existingIndex >= 0
        ? this.state.breadcrumbs.slice(0, existingIndex + 1)
        : [...this.state.breadcrumbs, nextFolder];

    this.setState({
      breadcrumbs: nextBreadcrumbs,
      currentFolder: nextFolder,
      currentFolderId: folderId,
    });

    this.emit("breadcrumbsChanged", { breadcrumbs: nextBreadcrumbs });
    this.emit("folderChanged", { folder: nextFolder });

    return nextFolder;
  }

  applyLoadedFolder(result: ExplorerTransportResult): void {
    this.setState({
      breadcrumbs: result.breadcrumbs,
      currentFolder: result.folder,
      currentFolderId: result.folderId,
    });

    this.emit("breadcrumbsChanged", { breadcrumbs: result.breadcrumbs });
    this.emit("folderLoaded", { folder: result.folder });
  }
}
