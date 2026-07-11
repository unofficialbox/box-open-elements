import { describe, expect, it, vi } from "vitest";

import { ExplorerActionsController } from "../../../src/patterns/content-explorer/actions/controller.js";

describe("ExplorerActionsController", () => {
  it("filters configured actions by item type", () => {
    const controller = new ExplorerActionsController({
      itemActions: [
        { id: "preview", label: "Preview", itemTypes: ["file"] },
        { id: "open", label: "Open", itemTypes: ["folder"] },
      ],
    });

    controller.setItems([
      { id: "1", name: "File", type: "file" },
      { id: "2", name: "Folder", type: "folder" },
    ]);

    expect(controller.getItemActions("1")).toEqual([{ id: "preview", label: "Preview", itemTypes: ["file"] }]);
    expect(controller.getItemActions("2")).toEqual([{ id: "open", label: "Open", itemTypes: ["folder"] }]);
  });

  it("emits item action invocation payloads", () => {
    const controller = new ExplorerActionsController({
      itemActions: [{ id: "preview", label: "Preview", itemTypes: ["file"] }],
    });
    const invoked = vi.fn();

    controller.subscribe("itemActionInvoked", payload => {
      invoked(payload);
    });

    controller.setItems([{ id: "1", name: "File", type: "file" }]);
    controller.invokeItemAction("1", "preview");

    expect(invoked).toHaveBeenCalledWith({
      action: { id: "preview", label: "Preview", itemTypes: ["file"] },
      item: { id: "1", name: "File", type: "file" },
    });
  });
});
