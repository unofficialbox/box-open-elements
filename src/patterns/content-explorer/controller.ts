import { Controller } from "../../core/controller.js";
import { ExplorerActionsController } from "./actions/controller.js";
import { ExplorerCollectionController } from "./collection/controller.js";
import { ExplorerNavigationController } from "./navigation/controller.js";
import { ExplorerSelectionController } from "./selection/controller.js";
import type {
  ExplorerEvents,
  ExplorerItem,
  ExplorerSelectionMode,
  ExplorerSessionConfig,
  ExplorerState,
  ExplorerTransportResult,
} from "./types.js";

const createInitialState = (config: ExplorerSessionConfig): ExplorerState => ({
  availableActionsByItemId: {},
  breadcrumbs: [],
  connected: false,
  currentFolder: null,
  currentFolderId: config.rootFolderId,
  error: null,
  items: [],
  loading: false,
  pagination: {
    hasMoreItems: false,
    limit: config.pageSize ?? 100,
    offset: 0,
    totalCount: null,
  },
  selectedItemIds: [],
});

export class ContentExplorerController extends Controller<ExplorerState, ExplorerEvents> {
  readonly config: ExplorerSessionConfig;

  private activeLoadRequestId = 0;

  private readonly actionsController: ExplorerActionsController;

  private readonly collectionController: ExplorerCollectionController;

  private readonly navigationController: ExplorerNavigationController;

  private readonly selectionController: ExplorerSelectionController;

  constructor(config: ExplorerSessionConfig) {
    super(createInitialState(config));
    this.config = config;
    this.actionsController = new ExplorerActionsController({ itemActions: config.itemActions });
    this.collectionController = new ExplorerCollectionController({ pageSize: config.pageSize });
    this.navigationController = new ExplorerNavigationController({ rootFolderId: config.rootFolderId });
    this.selectionController = new ExplorerSelectionController({ selectionMode: config.selectionMode });

    this.actionsController.subscribe("itemActionInvoked", payload => {
      this.emit("itemActionInvoked", payload);
    });
    this.collectionController.subscribe("itemsChanged", ({ items }) => {
      this.setState({
        ...this.state,
        items,
      });
      this.emit("itemsChanged", { items });
    });
    this.collectionController.subscribe("loadingChanged", ({ loading }) => {
      this.setState({
        ...this.state,
        loading,
      });
      this.emit("loadingChanged", { loading });
    });
    this.collectionController.subscribe("paginationChanged", ({ pagination }) => {
      this.setState({
        ...this.state,
        pagination,
      });
      this.emit("paginationChanged", { pagination });
    });
    this.navigationController.subscribe("breadcrumbsChanged", ({ breadcrumbs }) => {
      this.setState({
        ...this.state,
        breadcrumbs,
      });
      this.emit("breadcrumbsChanged", { breadcrumbs });
    });
    this.navigationController.subscribe("folderChanged", ({ folder }) => {
      this.setState({
        ...this.state,
        currentFolder: folder,
        currentFolderId: folder.id,
      });
      this.emit("folderChanged", { folder });
    });
    this.navigationController.subscribe("folderLoaded", ({ folder }) => {
      const navigationState = this.navigationController.getState();
      this.setState({
        ...this.state,
        breadcrumbs: navigationState.breadcrumbs,
        currentFolder: folder,
        currentFolderId: navigationState.currentFolderId,
      });
      this.emit("folderLoaded", { folder });
    });
  }

  get selectionMode(): ExplorerSelectionMode {
    return this.config.selectionMode ?? "multiple";
  }

  async connect(): Promise<void> {
    if (this.state.connected) {
      return;
    }

    this.setState({
      ...this.state,
      connected: true,
    });

    this.emit("connected", { folderId: this.state.currentFolderId });
    await this.reload();
  }

  disconnect(): void {
    if (!this.state.connected) {
      return;
    }

    this.setState({
      ...this.state,
      breadcrumbs: [],
      connected: false,
      currentFolder: this.navigationController.getState().currentFolder,
      error: null,
      items: [],
      loading: false,
      pagination: this.collectionController.getState().pagination,
      selectedItemIds: [],
    });

    this.activeLoadRequestId += 1;
    this.collectionController.reset();
    this.navigationController.reset();
    this.emit("disconnected", undefined);
  }

  async navigateTo(folderId: string): Promise<void> {
    const nextFolder = this.navigationController.navigateTo(folderId);
    if (!nextFolder) {
      return;
    }

    this.setState({
      ...this.state,
      currentFolder: nextFolder,
      currentFolderId: folderId,
      error: null,
      items: [],
      pagination: this.collectionController.getState().pagination,
      selectedItemIds: [],
      availableActionsByItemId: {},
    });

    this.collectionController.reset();
    this.actionsController.setItems([]);
    this.selectionController.setItems([]);
    await this.reload();
  }

  setItems(items: ExplorerItem[]): void {
    this.collectionController.setItems(items);
    this.actionsController.setItems(items);
    this.selectionController.setItems(items);
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      availableActionsByItemId: this.actionsController.getState().availableActionsByItemId,
      error: null,
      items: this.collectionController.getState().items,
      selectedItemIds,
    });
    this.emit("selectionChanged", { selectedItemIds });
  }

  select(itemIds: string[]): void {
    this.selectionController.select(itemIds);
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
  }

  toggleSelection(itemId: string): void {
    this.selectionController.toggleSelection(itemId);
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
  }

  clearSelection(): void {
    this.selectionController.clearSelection();
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
  }

  getItemActions(itemId: string) {
    return this.actionsController.getItemActions(itemId);
  }

  invokeItemAction(itemId: string, actionId: string): void {
    this.actionsController.invokeItemAction(itemId, actionId);
  }

  async activateItem(itemId: string): Promise<void> {
    const item = this.state.items.find(entry => entry.id === itemId);
    if (!item) {
      return;
    }

    this.emit("itemActivated", { item });

    if (item.type === "folder") {
      await this.navigateTo(item.id);
    }
  }

  async reload(): Promise<void> {
    await this.loadPage({ append: false });
  }

  async refresh(): Promise<void> {
    await this.reload();
  }

  async loadNextPage(): Promise<void> {
    if (!this.state.connected || !this.collectionController.canLoadNextPage()) {
      return;
    }

    await this.loadPage({ append: true });
  }

  private async loadPage({ append }: { append: boolean }): Promise<void> {
    if (!this.state.connected) {
      return;
    }

    const requestId = this.activeLoadRequestId + 1;
    this.activeLoadRequestId = requestId;

    this.setState({
      ...this.state,
      error: null,
    });
    this.collectionController.startLoading();

    try {
      const result = await this.config.transport.loadFolderItems({
        folderId: this.state.currentFolderId,
        limit: this.collectionController.getState().pagination.limit,
        offset: append ? this.collectionController.getState().items.length : 0,
        token: this.config.token,
        language: this.config.language,
      });

      this.applyLoadedFolder(requestId, result, append);
    } catch (error) {
      this.applyLoadFailure(requestId, error, append);
    }
  }

  private applyLoadedFolder(requestId: number, result: ExplorerTransportResult, append: boolean): void {
    if (requestId !== this.activeLoadRequestId) {
      return;
    }

    this.collectionController.applyLoadResult(result, append);
    this.navigationController.applyLoadedFolder(result);
    const items = this.collectionController.getState().items;
    this.actionsController.setItems(items);
    this.selectionController.setItems(items);
    this.selectionController.select(this.state.selectedItemIds);
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      availableActionsByItemId: this.actionsController.getState().availableActionsByItemId,
      breadcrumbs: this.navigationController.getState().breadcrumbs,
      currentFolder: this.navigationController.getState().currentFolder,
      currentFolderId: this.navigationController.getState().currentFolderId,
      error: null,
      items,
      loading: this.collectionController.getState().loading,
      pagination: this.collectionController.getState().pagination,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
    this.emit("loadSucceeded", { folder: result.folder, folderId: result.folderId, items, pagination: result.pagination });
  }

  private applyLoadFailure(requestId: number, error: unknown, append: boolean): void {
    if (requestId !== this.activeLoadRequestId) {
      return;
    }

    const message = error instanceof Error ? error.message : "Failed to load folder items";
    this.collectionController.applyLoadFailure();
    const collectionState = this.collectionController.getState();

    this.setState({
      ...this.state,
      error: {
        code: "load_failed",
        message,
      },
      loading: collectionState.loading,
      availableActionsByItemId: append ? this.actionsController.getState().availableActionsByItemId : {},
      items: append ? collectionState.items : [],
      selectedItemIds: append ? this.state.selectedItemIds : [],
    });

    if (!append) {
      this.collectionController.setItems([]);
    }
    this.emit("selectionChanged", { selectedItemIds: append ? this.state.selectedItemIds : [] });
    this.emit("loadFailed", { folderId: this.state.currentFolderId, message });
  }
}
