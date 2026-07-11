import type { ExplorerItem, ExplorerItemAction } from "../types.js";

export interface ExplorerActionsControllerOptions {
  itemActions?: ExplorerItemAction[];
}

export interface ExplorerActionsState {
  availableActionsByItemId: Record<string, ExplorerItemAction[]>;
}

export interface ExplorerActionsEvents {
  itemActionInvoked: { action: ExplorerItemAction; item: ExplorerItem };
}
