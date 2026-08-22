import { useCallback, useSyncExternalStore } from "react";

import {
  ExplorerSelectionController,
  type ExplorerSelectionState,
} from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

// Re-exported so a React host can construct the controller through this
// package and hand it straight to the hook. Classes with private fields are
// nominally typed, so a host that imports the class from a differently
// resolved copy of the core package gets an incompatible identity — one
// import path sidesteps that whole class of version-skew errors.
export { ExplorerSelectionController };
export type { ExplorerSelectionState };

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
