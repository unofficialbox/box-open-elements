import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
import { createExplorerSelectionStore } from "../src/explorer-selection.js";

describe("Svelte adapter", () => {
  it("maps controller updates to a readable store and unsubscribes", () => {
    const controller = new ExplorerSelectionController();
    controller.setItems([{ id: "alpha" }]);
    const store = createExplorerSelectionStore(controller);
    const states: string[][] = [];
    const unsubscribe = store.subscribe(state => states.push([...state.selectedItemIds]));
    controller.toggleSelection("alpha");
    expect(get(store).selectedItemIds).toEqual(["alpha"]);
    unsubscribe();
    controller.clearSelection();
    expect(states.at(-1)).toEqual(["alpha"]);
  });
});
