import { readable, type Readable } from "svelte/store";
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

/** Svelte readable store backed by the framework-neutral selection controller. */
export const createExplorerSelectionStore = (
  controller: ExplorerSelectionController,
): Readable<Readonly<ExplorerSelectionState>> =>
  readable(controller.getState(), set =>
    controller.subscribe("selectionChanged", () => set(controller.getState())),
  );
