// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type {} from "../../../src/react-jsx.js";
import { Table } from "../../../src/components/collections/table.js";
import { TextField } from "../../../src/components/forms/text-field.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("native React 19 custom-element interop", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) act(() => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
  });

  it("assigns structured properties and receives dashed native CustomEvents", () => {
    Table.register();
    TextField.register();
    const onValueChanged = vi.fn();
    const onSelectionChanged = vi.fn();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root!.render(<>
        <box-table rows={[{ id: "one", cells: { name: "Contract" } }]}
          onselection-changed={onSelectionChanged} />
        <box-text-field value="Initial" onvalue-changed={onValueChanged} />
      </>);
    });

    const table = container.querySelector("box-table");
    const field = container.querySelector("box-text-field");
    expect(table?.rows).toEqual([{ id: "one", cells: { name: "Contract" } }]);
    expect(field?.value).toBe("Initial");

    act(() => {
      table?.dispatchEvent(new CustomEvent("selection-changed", {
        detail: { selectedIds: ["one"] }, bubbles: true, composed: true,
      }));
      field?.dispatchEvent(new CustomEvent("value-changed", {
        detail: { value: "Updated" }, bubbles: true, composed: true,
      }));
    });
    expect(onSelectionChanged.mock.calls[0]?.[0].detail.selectedIds).toEqual(["one"]);
    expect(onValueChanged.mock.calls[0]?.[0].detail.value).toBe("Updated");
  });
});
