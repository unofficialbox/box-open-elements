import { DestroyRef, inject, signal, type Signal } from "@angular/core";
import {
  ExplorerSelectionController,
  type ExplorerSelectionState,
} from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

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
