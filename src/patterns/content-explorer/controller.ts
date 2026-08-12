import { Controller } from "../../core/controller.js";
import { ExplorerActionsController } from "./actions/controller.js";
import { ExplorerCollectionController } from "./collection/controller.js";
import { ExplorerNavigationController } from "./navigation/controller.js";
import { ExplorerSelectionController } from "./selection/controller.js";
import type {
  ExplorerEvents,
  ExplorerItem,
  ExplorerMutationKind,
  ExplorerSearchResult,
  ExplorerSelectionMode,
  ExplorerSessionConfig,
  ExplorerSortBy,
  ExplorerSortDirection,
  ExplorerSortState,
  ExplorerState,
  ExplorerTransportResult,
  ExplorerViewState,
} from "./types.js";
import { createInitialExplorerViewState } from "./types.js";

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
  sort: null,
  view: createInitialExplorerViewState(),
});

export class ContentExplorerController extends Controller<ExplorerState, ExplorerEvents> {
  readonly config: ExplorerSessionConfig;

  private activeLoadRequestId = 0;

  private activeLoadAbortController: AbortController | null = null;

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

    // Invalidate and abort any in-flight load, then reset the sub-controllers
    // BEFORE snapshotting their state so the facade and navigation agree on
    // being back at the root.
    this.activeLoadRequestId += 1;
    this.activeLoadAbortController?.abort();
    this.activeLoadAbortController = null;
    this.collectionController.reset();
    this.navigationController.reset();

    this.setState({
      ...this.state,
      availableActionsByItemId: {},
      breadcrumbs: [],
      connected: false,
      currentFolder: null,
      currentFolderId: this.config.rootFolderId,
      error: null,
      items: [],
      loading: false,
      pagination: this.collectionController.getState().pagination,
      selectedItemIds: [],
      view: createInitialExplorerViewState(),
    });

    this.emit("viewChanged", { view: this.state.view });
    this.emit("disconnected", undefined);
  }

  private setView(view: ExplorerViewState): void {
    this.setState({
      ...this.state,
      view,
    });
    this.emit("viewChanged", { view });
  }

  async search(query: string, options?: { ancestorFolderId?: string }): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      await this.clearSearch();
      return;
    }

    if (!this.config.transport.searchItems) {
      throw new Error("Explorer transport does not support search");
    }

    if (!this.state.connected) {
      return;
    }

    const ancestorFolderId = options?.ancestorFolderId ?? this.state.currentFolderId;
    this.setView({
      mode: "search",
      searchQuery: trimmed,
      searchAncestorFolderId: ancestorFolderId,
    });
    this.setState({
      ...this.state,
      error: null,
      items: [],
      selectedItemIds: [],
      availableActionsByItemId: {},
      pagination: this.collectionController.getState().pagination,
    });
    this.collectionController.reset();
    this.actionsController.setItems([]);
    this.selectionController.setItems([]);
    await this.reload();
  }

  async clearSearch(): Promise<void> {
    if (this.state.view.mode === "folder" && !this.state.view.searchQuery) {
      return;
    }

    this.setView(createInitialExplorerViewState());
    this.setState({
      ...this.state,
      error: null,
      items: [],
      selectedItemIds: [],
      availableActionsByItemId: {},
    });
    this.collectionController.reset();
    this.actionsController.setItems([]);
    this.selectionController.setItems([]);

    if (this.state.connected) {
      await this.reload();
    }
  }

  async navigateTo(folderId: string): Promise<void> {
    const nextFolder = this.navigationController.navigateTo(folderId);
    if (!nextFolder) {
      return;
    }

    if (this.state.view.mode === "search") {
      this.setView(createInitialExplorerViewState());
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

  /**
   * Set (or clear) the collection sort and reload from the first page. The
   * transport receives the sort with every request; passing `null` restores
   * the server's default ordering.
   */
  async setSort(sort: ExplorerSortState | null): Promise<void>;
  async setSort(sortBy: ExplorerSortBy, direction: ExplorerSortDirection): Promise<void>;
  async setSort(
    sortOrSortBy: ExplorerSortState | ExplorerSortBy | null,
    direction?: ExplorerSortDirection,
  ): Promise<void> {
    const sort: ExplorerSortState | null =
      sortOrSortBy === null
        ? null
        : typeof sortOrSortBy === "string"
          ? { sortBy: sortOrSortBy, direction: direction ?? "ASC" }
          : sortOrSortBy;

    const current = this.state.sort;
    if (current?.sortBy === sort?.sortBy && current?.direction === sort?.direction) {
      return;
    }

    this.setState({
      ...this.state,
      sort,
    });
    this.emit("sortChanged", { sort });

    if (this.state.connected) {
      this.collectionController.reset();
      await this.reload();
    }
  }

  /** Create a folder in the current folder, then refresh the collection. */
  async createFolder(name: string): Promise<ExplorerItem | null> {
    const createFolder = this.config.transport.createFolder;
    if (!createFolder) {
      throw new Error("Explorer transport does not support folder creation");
    }
    const trimmed = name.trim();
    if (!trimmed || !this.state.connected) {
      return null;
    }

    return this.runMutation("create-folder", undefined, async () => {
      const item = await createFolder({
        parentFolderId: this.state.currentFolderId,
        name: trimmed,
        token: this.config.token,
        language: this.config.language,
      });
      this.emit("itemMutated", { kind: "create-folder", item, itemId: item.id });
      return item;
    });
  }

  /** Rename an item in the current collection, then refresh. */
  async renameItem(itemId: string, name: string): Promise<ExplorerItem | null> {
    const renameItem = this.config.transport.renameItem;
    if (!renameItem) {
      throw new Error("Explorer transport does not support rename");
    }
    const item = this.state.items.find(entry => entry.id === itemId);
    const trimmed = name.trim();
    if (!item || !trimmed || !this.state.connected) {
      return null;
    }

    return this.runMutation("rename", itemId, async () => {
      const renamed = await renameItem({
        itemId,
        itemType: item.type,
        name: trimmed,
        token: this.config.token,
        language: this.config.language,
      });
      this.emit("itemMutated", { kind: "rename", item: renamed, itemId });
      return renamed;
    });
  }

  /** Delete an item from the current collection, then refresh. */
  async deleteItem(itemId: string): Promise<boolean> {
    const deleteItem = this.config.transport.deleteItem;
    if (!deleteItem) {
      throw new Error("Explorer transport does not support delete");
    }
    const item = this.state.items.find(entry => entry.id === itemId);
    if (!item || !this.state.connected) {
      return false;
    }

    const result = await this.runMutation("delete", itemId, async () => {
      await deleteItem({
        itemId,
        itemType: item.type,
        token: this.config.token,
        language: this.config.language,
      });
      this.emit("itemMutated", { kind: "delete", itemId });
      return true;
    });
    return result ?? false;
  }

  private async runMutation<T>(
    kind: ExplorerMutationKind,
    itemId: string | undefined,
    perform: () => Promise<T>,
  ): Promise<T | null> {
    try {
      const result = await perform();
      await this.reload();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Explorer ${kind} failed`;
      this.setState({
        ...this.state,
        error: { code: "mutation_failed", message },
      });
      this.emit("mutationFailed", { kind, message, ...(itemId ? { itemId } : {}) });
      return null;
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

    // Abort the superseded in-flight request so the transport can cancel its
    // network work; the requestId guard already discards its response.
    this.activeLoadAbortController?.abort();
    const abortController = typeof AbortController === "function" ? new AbortController() : null;
    this.activeLoadAbortController = abortController;

    this.setState({
      ...this.state,
      error: null,
    });
    this.collectionController.startLoading();

    const pagination = this.collectionController.getState().pagination;
    const requestOffset = append ? (pagination.nextOffset ?? this.collectionController.getState().items.length) : 0;
    const sort = this.state.sort;

    try {
      if (this.state.view.mode === "search") {
        const searchItems = this.config.transport.searchItems;
        if (!searchItems) {
          throw new Error("Explorer transport does not support search");
        }
        const query = this.state.view.searchQuery ?? "";
        const result = await searchItems({
          query,
          ancestorFolderId: this.state.view.searchAncestorFolderId ?? undefined,
          limit: pagination.limit,
          offset: requestOffset,
          ...(sort ? { sortBy: sort.sortBy, sortDirection: sort.direction } : {}),
          token: this.config.token,
          language: this.config.language,
          ...(abortController ? { signal: abortController.signal } : {}),
        });
        this.applyLoadedSearch(requestId, result, append);
        return;
      }

      const result = await this.config.transport.loadFolderItems({
        folderId: this.state.currentFolderId,
        limit: pagination.limit,
        offset: requestOffset,
        ...(sort ? { sortBy: sort.sortBy, sortDirection: sort.direction } : {}),
        token: this.config.token,
        language: this.config.language,
        ...(abortController ? { signal: abortController.signal } : {}),
      });

      this.applyLoadedFolder(requestId, result, append);
    } catch (error) {
      this.applyLoadFailure(requestId, error, append);
    } finally {
      if (this.activeLoadAbortController === abortController) {
        this.activeLoadAbortController = null;
      }
    }
  }

  private applyLoadedSearch(requestId: number, result: ExplorerSearchResult, append: boolean): void {
    if (requestId !== this.activeLoadRequestId) {
      return;
    }

    this.collectionController.applyLoadResult(result, append);
    const items = this.collectionController.getState().items;
    this.actionsController.setItems(items);
    this.selectionController.setItems(items);
    this.selectionController.select(this.state.selectedItemIds);
    const selectedItemIds = this.selectionController.getState().selectedItemIds;

    this.setState({
      ...this.state,
      availableActionsByItemId: this.actionsController.getState().availableActionsByItemId,
      error: null,
      items,
      loading: this.collectionController.getState().loading,
      pagination: this.collectionController.getState().pagination,
      selectedItemIds,
      view: {
        mode: "search",
        searchQuery: result.query,
        searchAncestorFolderId: result.ancestorFolderId ?? this.state.view.searchAncestorFolderId,
      },
    });

    this.emit("selectionChanged", { selectedItemIds });
    this.emit("searchSucceeded", {
      query: result.query,
      items,
      pagination: this.collectionController.getState().pagination,
    });
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
