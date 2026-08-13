import { Controller } from "../../core/controller.js";
import { ContentExplorerController } from "../content-explorer/controller.js";
import type { ExplorerItem, ExplorerSessionConfig } from "../content-explorer/types.js";
import { isItemPickable } from "./types.js";
import type { PickerConstraints, PickerEvents, PickerSessionConfig, PickerState } from "./types.js";

const createInitialState = (config: PickerSessionConfig): PickerState => ({
  canChoose: false,
  maxSelectable: config.maxSelectable ?? null,
  selectedItems: [],
});

/**
 * A constrained explorer session for choosing content: the same browse /
 * search surface as ContentExplorerController, plus a cross-folder pick
 * roster with type / extension / count constraints and a choose/cancel
 * contract. The inner explorer's per-folder selection is kept in sync so
 * roster members render selected in whatever folder is on screen.
 */
export class ContentPickerController extends Controller<PickerState, PickerEvents> {
  readonly explorer: ContentExplorerController;

  private readonly constraints: PickerConstraints;

  private readonly roster = new Map<string, ExplorerItem>();

  private readonly unsubscribeFns: Array<() => void>;

  constructor(config: PickerSessionConfig) {
    super(createInitialState(config));
    const { extensions, maxSelectable, selectableTypes, ...explorerConfig } = config;
    this.constraints = { extensions, maxSelectable, selectableTypes };
    this.explorer = new ContentExplorerController({
      ...(explorerConfig as Omit<ExplorerSessionConfig, "itemActions" | "selectionMode">),
      selectionMode: maxSelectable === 1 ? "single" : "multiple",
    });

    // Re-mark roster members whenever the visible collection changes —
    // navigation and search reset the explorer's own selection.
    const resync = () => {
      this.syncExplorerSelection();
    };
    this.unsubscribeFns = [
      this.explorer.subscribe("loadSucceeded", resync),
      this.explorer.subscribe("searchSucceeded", resync),
    ];
  }

  async connect(): Promise<void> {
    await this.explorer.connect();
  }

  disconnect(): void {
    this.explorer.disconnect();
    if (this.roster.size > 0) {
      this.roster.clear();
      this.publishSelection();
    }
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.explorer.destroy();
    super.destroy();
  }

  isItemPickable(item: ExplorerItem): boolean {
    return isItemPickable(item, this.constraints);
  }

  isPicked(itemId: string): boolean {
    return this.roster.has(itemId);
  }

  /**
   * Toggle an item in or out of the roster. Unpicking works for any roster
   * member (including items picked in another folder); picking requires the
   * item to be in the current collection, eligible, and under the limit.
   * With `maxSelectable: 1` picking replaces the previous pick.
   */
  togglePick(itemId: string): void {
    if (this.roster.has(itemId)) {
      this.roster.delete(itemId);
      this.publishSelection();
      return;
    }

    const item = this.explorer.getState().items.find(entry => entry.id === itemId);
    if (!item) {
      return;
    }

    if (!this.isItemPickable(item)) {
      this.emit("selectionRejected", { item, reason: "not-selectable" });
      return;
    }

    const max = this.state.maxSelectable;
    if (max !== null && this.roster.size >= max) {
      if (max === 1) {
        this.roster.clear();
      } else {
        this.emit("selectionRejected", { item, reason: "limit-reached" });
        return;
      }
    }

    this.roster.set(itemId, item);
    this.publishSelection();
  }

  unpick(itemId: string): void {
    if (this.roster.delete(itemId)) {
      this.publishSelection();
    }
  }

  clearPicks(): void {
    if (this.roster.size === 0) {
      return;
    }
    this.roster.clear();
    this.publishSelection();
  }

  /** Emit `chosen` with the roster. No-op (returns null) while it is empty. */
  choose(): ExplorerItem[] | null {
    if (this.roster.size === 0) {
      return null;
    }
    const items = [...this.roster.values()];
    this.emit("chosen", { items });
    return items;
  }

  /** Abandon the session: clears the roster and emits `cancelled`. */
  cancel(): void {
    if (this.roster.size > 0) {
      this.roster.clear();
      this.publishSelection();
    }
    this.emit("cancelled", undefined);
  }

  private publishSelection(): void {
    this.syncExplorerSelection();
    const selectedItems = [...this.roster.values()];
    this.setState({
      ...this.state,
      canChoose: selectedItems.length > 0,
      selectedItems,
    });
    this.emit("selectionChanged", { selectedItems });
  }

  private syncExplorerSelection(): void {
    const visibleIds = this.explorer
      .getState()
      .items.filter(item => this.roster.has(item.id))
      .map(item => item.id);
    this.explorer.select(visibleIds);
  }
}
