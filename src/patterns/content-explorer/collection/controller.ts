import { Controller } from "../../../core/controller.js";
import type { ExplorerItem, ExplorerPaginationState } from "../types.js";
import type {
  ExplorerCollectionControllerOptions,
  ExplorerCollectionEvents,
  ExplorerCollectionState,
} from "./types.js";

export interface ExplorerCollectionLoadResult {
  items: ExplorerItem[];
  pagination: ExplorerPaginationState;
}

const DEFAULT_PAGE_SIZE = 100;

const createInitialPaginationState = (
  options: ExplorerCollectionControllerOptions = {},
): ExplorerCollectionState["pagination"] => ({
  hasMoreItems: false,
  limit: options.pageSize ?? DEFAULT_PAGE_SIZE,
  offset: 0,
  totalCount: null,
});

const createInitialState = (
  options: ExplorerCollectionControllerOptions = {},
): ExplorerCollectionState => ({
  items: [],
  loading: false,
  pagination: createInitialPaginationState(options),
});

export class ExplorerCollectionController extends Controller<
  ExplorerCollectionState,
  ExplorerCollectionEvents
> {
  private readonly options: ExplorerCollectionControllerOptions;

  constructor(options: ExplorerCollectionControllerOptions = {}) {
    super(createInitialState(options));
    this.options = options;
  }

  reset(): void {
    this.setState(createInitialState(this.options));
    this.emit("itemsChanged", { items: this.state.items });
    this.emit("paginationChanged", { pagination: this.state.pagination });
    this.emit("loadingChanged", { loading: this.state.loading });
  }

  setItems(items: ExplorerCollectionState["items"]): void {
    this.setState({
      ...this.state,
      items,
    });
    this.emit("itemsChanged", { items });
  }

  startLoading(): void {
    if (this.state.loading) {
      return;
    }

    this.setState({
      ...this.state,
      loading: true,
    });
    this.emit("loadingChanged", { loading: true });
  }

  applyLoadResult(result: ExplorerCollectionLoadResult, append: boolean): void {
    const items = append ? [...this.state.items, ...result.items] : result.items;

    this.setState({
      items,
      loading: false,
      pagination: result.pagination,
    });

    this.emit("itemsChanged", { items });
    this.emit("paginationChanged", { pagination: result.pagination });
    this.emit("loadingChanged", { loading: false });
  }

  applyLoadFailure(): void {
    if (!this.state.loading) {
      return;
    }

    this.setState({
      ...this.state,
      loading: false,
    });
    this.emit("loadingChanged", { loading: false });
  }

  canLoadNextPage(): boolean {
    return !this.state.loading && this.state.pagination.hasMoreItems;
  }
}
