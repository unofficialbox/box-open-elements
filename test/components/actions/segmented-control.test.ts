// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxSegmentedControlElement,
  defineBoxSegmentedControlElement,
} from "../../../src/components/actions/segmented-control.js";

describe("BoxSegmentedControlElement", () => {
  beforeEach(() => {
    defineBoxSegmentedControlElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("selects the first enabled option by default and emits changes", () => {
    const element = document.createElement("box-segmented-control") as BoxSegmentedControlElement;
    const changed = vi.fn();
    element.options = [
      { label: "List", value: "list" },
      { label: "Board", value: "board" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    expect(element.value).toBe("list");

    const buttons = element.shadowRoot?.querySelectorAll('[part="segment"]') ?? [];
    (buttons[1] as HTMLButtonElement | undefined)?.click();

    expect(element.value).toBe("board");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "board" },
      }),
    );
  });

  it("supports arrow-key navigation between options", () => {
    const element = document.createElement("box-segmented-control") as BoxSegmentedControlElement;
    element.options = [
      { label: "Comfortable", value: "comfortable" },
      { label: "Compact", value: "compact" },
    ];

    document.body.append(element);

    const buttons = element.shadowRoot?.querySelectorAll('[part="segment"]') ?? [];
    const firstButton = buttons[0] as HTMLButtonElement | undefined;
    firstButton?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("compact");
  });

  it("supports attached layout metadata for grouped styling", () => {
    const element = document.createElement("box-segmented-control") as BoxSegmentedControlElement;
    element.layout = "attached";
    element.options = [
      { label: "Comfortable", value: "comfortable" },
      { label: "Compact", value: "compact" },
      { label: "Dense", value: "dense" },
    ];

    document.body.append(element);

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLElement | null;
    const segments = element.shadowRoot?.querySelectorAll('[part="segment"]') ?? [];

    expect(control?.dataset.layout).toBe("attached");
    expect((segments[0] as HTMLElement | undefined)?.dataset.position).toBe("first");
    expect((segments[1] as HTMLElement | undefined)?.dataset.position).toBe("middle");
    expect((segments[2] as HTMLElement | undefined)?.dataset.position).toBe("last");
  });
});
