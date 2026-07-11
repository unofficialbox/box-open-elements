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

    const nextFolder: ExplorerFolder = {
      id: folderId,
      name: folderId,
      type: "folder",
    };
    const nextBreadcrumbs: ExplorerBreadcrumb[] = [
      ...this.state.breadcrumbs.filter(crumb => crumb.id !== folderId),
      nextFolder,
    ];

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
