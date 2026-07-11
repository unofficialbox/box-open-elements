// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxAccordionElement,
  defineBoxAccordionElement,
} from "../../../src/components/navigation/accordion.js";

describe("BoxAccordionElement", () => {
  beforeEach(() => {
    defineBoxAccordionElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the first item open by default", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    element.items = [
      { label: "Details", value: "details", content: "Item details" },
      { label: "History", value: "history", content: "Activity history" },
    ];

    document.body.append(element);

    expect(element.getAttribute("value")).toBe("details");
    expect(element.shadowRoot?.textContent).toContain("Item details");
  });

  it("emits value-changed when a different panel is opened", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    const changed = vi.fn();
    element.items = [
      { label: "Details", value: "details", content: "Item details" },
      { label: "History", value: "history", content: "Activity history" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const triggers = element.shadowRoot?.querySelectorAll('[part="trigger"]') ?? [];
    (triggers[1] as HTMLButtonElement | undefined)?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "history" },
      }),
    );
  });
});
