import { useCallback, useSyncExternalStore } from "react";

import {
  ExplorerSelectionController,
  type ExplorerSelectionState,
} from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

/**
 * Subscribes React to the framework-neutral explorer selection controller.
 * Selection behavior remains owned entirely by the controller.
 */
export const useExplorerSelectionController = (
  controller: ExplorerSelectionController,
): Readonly<ExplorerSelectionState> => {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      controller.subscribe("selectionChanged", () => onStoreChange()),
    [controller],
  );
  const getSnapshot = useCallback(() => controller.getState(), [controller]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
