import type { ExplorerItem, ExplorerSelectionMode } from "../types.js";

export interface ExplorerSelectionControllerOptions {
  selectionMode?: ExplorerSelectionMode;
}

export interface ExplorerSelectionState {
  selectedItemIds: string[];
  selectionMode: ExplorerSelectionMode;
}

export interface ExplorerSelectionEvents {
  selectionChanged: { selectedItemIds: string[] };
}

export type ExplorerSelectableItem = Pick<ExplorerItem, "id">;
