import {
  getCurrentScope,
  onScopeDispose,
  readonly,
  shallowRef,
  type DeepReadonly,
  type ShallowRef,
} from "vue";
import {
  ExplorerSelectionController,
  type ExplorerSelectionState,
} from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

// Re-exported so a host can construct the controller through this package and
// hand it straight to the adapter API. Classes with private fields are
// nominally typed, so a host that imports the class from a differently
// resolved copy of the core package gets an incompatible identity — one
// import path sidesteps that whole class of version-skew errors.
export { ExplorerSelectionController };
export type { ExplorerSelectionState };

/** Vue composable for the framework-neutral explorer selection controller. */
export const useExplorerSelectionController = (
  controller: ExplorerSelectionController,
): DeepReadonly<ShallowRef<Readonly<ExplorerSelectionState>>> => {
  const state = shallowRef<Readonly<ExplorerSelectionState>>(controller.getState());
  const unsubscribe = controller.subscribe("selectionChanged", () => {
    state.value = controller.getState();
  });
  if (getCurrentScope()) onScopeDispose(unsubscribe);
  return readonly(state);
};
