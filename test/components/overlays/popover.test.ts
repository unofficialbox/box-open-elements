// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxPopoverElement, defineBoxPopoverElement } from "../../../src/components/overlays/popover.js";

describe("BoxPopoverElement", () => {
  beforeEach(() => {
    defineBoxPopoverElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("toggles open state from the trigger", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.label = "Open details";
    element.innerHTML = "<p>Popover content</p>";

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="surface"]')).not.toBeNull();
  });

  it("closes on Escape from the trigger", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;

    document.body.append(element);
    element.show();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(element.open).toBe(false);
  });
});
