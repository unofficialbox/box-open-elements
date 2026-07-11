// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDropdownElement,
  defineBoxDropdownElement,
} from "../../../src/components/forms/dropdown.js";

describe("BoxDropdownElement", () => {
  beforeEach(() => {
    defineBoxDropdownElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders items and emits value changes", () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    const changed = vi.fn();
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();
    const item = element.shadowRoot?.querySelector('[part="item"][data-item-id="table"]') as HTMLButtonElement | null;
    item?.click();

    expect(element.value).toBe("table");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ value: "table" }),
      }),
    );
  });

  it("does not open when disabled", () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];
    element.disabled = true;

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
  });

  it("opens from keyboard on ArrowDown", () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(element.shadowRoot?.querySelector('[part="menu"]')).not.toBeNull();
  });
});
