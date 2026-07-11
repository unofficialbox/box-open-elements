// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxTooltipElement,
  defineBoxTooltipElement,
} from "../../../src/components/overlays/tooltip.js";

describe("BoxTooltipElement", () => {
  beforeEach(() => {
    defineBoxTooltipElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows tooltip content on hover", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Helpful context";

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new Event("mouseenter"));

    expect(element.shadowRoot?.textContent).toContain("Helpful context");
    const openTrigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    expect(openTrigger?.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("emits open changes when toggled", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    const changed = vi.fn();
    element.addEventListener("open-changed", changed);

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { open: true },
      }),
    );
  });

  it("closes on Escape", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;

    document.body.append(element);
    element.show();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(element.open).toBe(false);
  });
});
