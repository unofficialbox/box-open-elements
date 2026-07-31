import { readable, type Readable } from "svelte/store";
import {
  ExplorerSelectionController,
  type ExplorerSelectionState,
} from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

/** Svelte readable store backed by the framework-neutral selection controller. */
export const createExplorerSelectionStore = (
  controller: ExplorerSelectionController,
): Readable<Readonly<ExplorerSelectionState>> =>
  readable(controller.getState(), set =>
    controller.subscribe("selectionChanged", () => set(controller.getState())),
  );
