import { describe, expect, it, vi } from "vitest";

import { ExplorerSelectionController } from "../../src/patterns/content-explorer/selection/controller.js";

describe("ExplorerSelectionController", () => {
  it("supports multiple selection by default", () => {
    const controller = new ExplorerSelectionController();

    controller.setItems([{ id: "1" }, { id: "2" }]);
    controller.select(["1", "2"]);

    expect(controller.getState()).toEqual({
      selectedItemIds: ["1", "2"],
      selectionMode: "multiple",
    });
  });

  it("enforces single selection mode", () => {
    const controller = new ExplorerSelectionController({ selectionMode: "single" });

    controller.setItems([{ id: "1" }, { id: "2" }]);
    controller.select(["1", "2"]);

    expect(controller.getState().selectedItemIds).toEqual(["1"]);

    controller.toggleSelection("2");

    expect(controller.getState().selectedItemIds).toEqual(["2"]);
  });

  it("drops selection for items that are no longer available", () => {
    const controller = new ExplorerSelectionController();

    controller.setItems([{ id: "1" }, { id: "2" }]);
    controller.select(["1", "2"]);
    controller.setItems([{ id: "2" }]);

    expect(controller.getState().selectedItemIds).toEqual(["2"]);
  });

  it("emits selectionChanged on toggle and clear", () => {
    const controller = new ExplorerSelectionController();
    const listener = vi.fn();

    controller.setItems([{ id: "1" }]);
    controller.subscribe("selectionChanged", listener);

    controller.toggleSelection("1");
    expect(listener).toHaveBeenLastCalledWith({ selectedItemIds: ["1"] });

    controller.clearSelection();
    expect(listener).toHaveBeenLastCalledWith({ selectedItemIds: [] });
  });

  it("ignores toggling unknown items", () => {
    const controller = new ExplorerSelectionController();

    controller.setItems([{ id: "1" }]);
    controller.toggleSelection("nope");

    expect(controller.getState().selectedItemIds).toEqual([]);
  });
});
