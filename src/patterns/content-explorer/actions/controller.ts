import { Controller } from "../../../core/controller.js";
import type { ExplorerItem, ExplorerItemAction } from "../types.js";
import type { ExplorerActionsControllerOptions, ExplorerActionsEvents, ExplorerActionsState } from "./types.js";

const createInitialState = (): ExplorerActionsState => ({
  availableActionsByItemId: {},
});

export class ExplorerActionsController extends Controller<ExplorerActionsState, ExplorerActionsEvents> {
  private itemActions: ExplorerItemAction[];

  private itemsById = new Map<string, ExplorerItem>();

  constructor(options: ExplorerActionsControllerOptions = {}) {
    super(createInitialState());
    this.itemActions = options.itemActions ?? [];
  }

  setItems(items: ExplorerItem[]): void {
    this.itemsById = new Map(items.map(item => [item.id, item]));
    const availableActionsByItemId = Object.fromEntries(items.map(item => [item.id, this.resolveActionsForItem(item)]));

    this.setState({
      availableActionsByItemId,
    });
  }

  getItemActions(itemId: string): ExplorerItemAction[] {
    return this.state.availableActionsByItemId[itemId] ?? [];
  }

  invokeItemAction(itemId: string, actionId: string): void {
    const item = this.itemsById.get(itemId);
    if (!item) {
      return;
    }

    const action = this.getItemActions(itemId).find(entry => entry.id === actionId);
    if (!action || action.disabled) {
      return;
    }

    this.emit("itemActionInvoked", { action, item });
  }

  private resolveActionsForItem(item: ExplorerItem): ExplorerItemAction[] {
    return this.itemActions
      .filter(action => (action.itemTypes ? action.itemTypes.includes(item.type) : true))
      .map(action => {
        if (!action.requiresPermission) {
          return action;
        }
        // Only an explicit `false` denies: items without permission data keep
        // the action enabled rather than guessing.
        const allowed = item.permissions?.[action.requiresPermission] !== false;
        return allowed ? action : { ...action, disabled: true };
      });
  }
}
