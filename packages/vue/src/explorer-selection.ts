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
