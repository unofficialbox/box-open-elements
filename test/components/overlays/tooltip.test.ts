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

  it("does not immediately close when click follows focus-open", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new Event("focus"));
    expect(element.open).toBe(true);

    trigger?.click();

    expect(element.open).toBe(true);
  });

  it("closes on Escape", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;

    document.body.append(element);
    element.show();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(element.open).toBe(false);
  });

  it("includes focus-visible and interactive styles for the trigger", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="trigger"]:focus-visible');
    expect(styles).toContain('[part="trigger"]:hover:not(:disabled)');
    expect(styles).toContain('[part="trigger"]:active:not(:disabled)');
    expect(styles).toContain('[part="trigger"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-hover");
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });

  it("positions the tooltip panel absolutely without duplicating trigger and description text", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Retention policy details";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("position: relative");
    expect(styles).toContain('[part="tooltip"]');
    expect(styles).toContain("position: absolute");

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute("aria-label")).toBe("More information");
    expect(trigger.getAttribute("aria-label")).not.toBe(element.label);

    trigger.dispatchEvent(new Event("mouseenter"));
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="tooltip"]')?.textContent).toBe(
      "Retention policy details",
    );
  });
});
