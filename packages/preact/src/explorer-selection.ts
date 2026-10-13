import { useLayoutEffect, useState } from "preact/hooks";
import { ExplorerSelectionController, type ExplorerSelectionState } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
export { ExplorerSelectionController };
export type { ExplorerSelectionState };

export function useExplorerSelectionController(controller: ExplorerSelectionController): Readonly<ExplorerSelectionState> {
  const [snapshot, setSnapshot] = useState(() => ({ controller, state: controller.getState() }));
  useLayoutEffect(() => {
    const update = () => setSnapshot({ controller, state: controller.getState() });
    const unsubscribe = controller.subscribe("selectionChanged", update);
    update();
    return unsubscribe;
  }, [controller]);
  return snapshot.controller === controller ? snapshot.state : controller.getState();
}
