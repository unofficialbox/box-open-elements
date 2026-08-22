import { DestroyRef, inject, signal, type Signal } from "@angular/core";
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

/**
 * Exposes the framework-neutral selection controller as an Angular signal.
 * Call inside an injection context, or pass a DestroyRef explicitly in tests.
 */
export const createExplorerSelectionSignal = (
  controller: ExplorerSelectionController,
  destroyRef: DestroyRef = inject(DestroyRef),
): Signal<Readonly<ExplorerSelectionState>> => {
  const state = signal<Readonly<ExplorerSelectionState>>(controller.getState());
  const unsubscribe = controller.subscribe("selectionChanged", () => {
    state.set(controller.getState());
  });
  destroyRef.onDestroy(unsubscribe);
  return state.asReadonly();
};
