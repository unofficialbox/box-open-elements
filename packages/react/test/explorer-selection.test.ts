// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ExplorerSelectionController } from "../../../src/patterns/content-explorer/selection/index.js";
import { useExplorerSelectionController } from "../src/explorer-selection.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("React controller composition", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders controller state without copying its selection state machine", () => {
    const controller = new ExplorerSelectionController();
    controller.setItems([{ id: "1" }, { id: "2" }]);

    const Harness = () => {
      const selection = useExplorerSelectionController(controller);
      return createElement(
        "button",
        { type: "button", onClick: () => controller.toggleSelection("2") },
        selection.selectedItemIds.join(",") || "None",
      );
    };

    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(createElement(Harness)));

    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("None");

    act(() => button.click());
    expect(button.textContent).toBe("2");

    act(() => controller.clearSelection());
    expect(button.textContent).toBe("None");
  });
});
