// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxButtonGroupElement,
  defineBoxButtonGroupElement,
} from "../../../src/components/actions/button-group.js";

describe("BoxButtonGroupElement", () => {
  beforeEach(() => {
    defineBoxButtonGroupElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("selects the first option by default and emits changes", () => {
    const element = document.createElement("box-button-group") as BoxButtonGroupElement;
    const changed = vi.fn();
    element.options = [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    expect(element.value).toBe("list");

    const buttons = element.shadowRoot?.querySelectorAll('[part="button"]') ?? [];
    (buttons[1] as HTMLButtonElement | undefined)?.click();

    expect(element.value).toBe("table");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "table" },
      }),
    );
  });

  it("uses radio-group semantics and supports arrow key navigation", () => {
    const element = document.createElement("box-button-group") as BoxButtonGroupElement;
    element.options = [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
    ];

    document.body.append(element);

    const group = element.shadowRoot?.querySelector('[part="group"]') as HTMLElement | null;
    const buttons = element.shadowRoot?.querySelectorAll('[part="button"]') ?? [];
    const firstButton = buttons[0] as HTMLButtonElement | undefined;
    const secondButton = buttons[1] as HTMLButtonElement | undefined;

    expect(group?.getAttribute("role")).toBe("radiogroup");
    expect(firstButton?.getAttribute("role")).toBe("radio");
    expect(firstButton?.getAttribute("aria-checked")).toBe("true");
    expect(secondButton?.getAttribute("aria-checked")).toBe("false");

    firstButton?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("table");
  });

  it("supports attached layout metadata for grouped styling", () => {
    const element = document.createElement("box-button-group") as BoxButtonGroupElement;
    element.layout = "attached";
    element.options = [
      { label: "Archive", value: "archive" },
      { label: "Report", value: "report" },
      { label: "Snooze", value: "snooze" },
    ];

    document.body.append(element);

    const group = element.shadowRoot?.querySelector('[part="group"]') as HTMLElement | null;
    const buttons = element.shadowRoot?.querySelectorAll('[part="button"]') ?? [];

    expect(group?.dataset.layout).toBe("attached");
    expect((buttons[0] as HTMLElement | undefined)?.dataset.position).toBe("first");
    expect((buttons[1] as HTMLElement | undefined)?.dataset.position).toBe("middle");
    expect((buttons[2] as HTMLElement | undefined)?.dataset.position).toBe("last");
  });
});
