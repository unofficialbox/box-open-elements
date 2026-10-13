import { createSignal, getOwner, onCleanup, type Accessor } from "solid-js";
import { ExplorerSelectionController, type ExplorerSelectionState } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
export { ExplorerSelectionController };
export type { ExplorerSelectionState };

/** Call inside a Solid owner; disposal releases the controller subscription. */
export function useExplorerSelectionController(controller: ExplorerSelectionController): Accessor<Readonly<ExplorerSelectionState>> {
  if (!getOwner()) throw new Error("useExplorerSelectionController requires a Solid reactive owner.");
  const [state, setState] = createSignal(controller.getState());
  const unsubscribe = controller.subscribe("selectionChanged", () => setState(controller.getState()));
  onCleanup(unsubscribe);
  return state;
}
