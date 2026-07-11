import { Controller } from "../../../core/controller.js";
import type {
  ExplorerSelectableItem,
  ExplorerSelectionControllerOptions,
  ExplorerSelectionEvents,
  ExplorerSelectionState,
} from "./types.js";

const createInitialState = (options: ExplorerSelectionControllerOptions): ExplorerSelectionState => ({
  selectedItemIds: [],
  selectionMode: options.selectionMode ?? "multiple",
});

export class ExplorerSelectionController extends Controller<ExplorerSelectionState, ExplorerSelectionEvents> {
  private availableItemIds = new Set<string>();

  constructor(options: ExplorerSelectionControllerOptions = {}) {
    super(createInitialState(options));
  }

  setItems(items: ExplorerSelectableItem[]): void {
    this.availableItemIds = new Set(items.map(item => item.id));
    const selectedItemIds = this.filterValidIds(this.state.selectedItemIds);

    this.setState({
      ...this.state,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
  }

  select(itemIds: string[]): void {
    const selectedItemIds = this.applySelectionMode(this.filterValidIds(itemIds));

    this.setState({
      ...this.state,
      selectedItemIds,
    });

    this.emit("selectionChanged", { selectedItemIds });
  }

  toggleSelection(itemId: string): void {
    if (!this.availableItemIds.has(itemId)) {
      return;
    }

    const existing = new Set(this.state.selectedItemIds);
    if (existing.has(itemId)) {
      existing.delete(itemId);
    } else if (this.state.selectionMode === "single") {
      existing.clear();
      existing.add(itemId);
    } else {
      existing.add(itemId);
    }

    this.select([...existing]);
  }

  clearSelection(): void {
    this.select([]);
  }

  private filterValidIds(itemIds: string[]): string[] {
    return itemIds.filter(itemId => this.availableItemIds.has(itemId));
  }

  private applySelectionMode(itemIds: string[]): string[] {
    return this.state.selectionMode === "single" ? itemIds.slice(0, 1) : itemIds;
  }
}
