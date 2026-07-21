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

    const host = element.shadowRoot?.querySelector('[part="trigger-host"]') as HTMLElement | null;
    host?.dispatchEvent(new Event("mouseenter"));

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
    trigger?.focus();
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

  it("uses compact tooltip panel radius", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("border-radius: 20px;");
  });

  it("uses a custom trigger label when provided", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Retention policy details";
    element.triggerLabel = "View retention policy";

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute("aria-label")).toBe("View retention policy");
  });

  it("positions the tooltip panel as a fixed overlay without duplicating trigger and description text", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Retention policy details";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("position: relative");
    expect(styles).toContain('[part="tooltip"]');
    expect(styles).toContain("position: fixed");

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute("aria-label")).toBe("More information");
    expect(trigger.getAttribute("aria-label")).not.toBe(element.label);

    const host = element.shadowRoot?.querySelector('[part="trigger-host"]') as HTMLElement;
    host.dispatchEvent(new Event("mouseenter"));
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="tooltip"]')?.textContent).toBe(
      "Retention policy details",
    );
  });

  it("uses a slotted trigger and associates aria-describedby with it", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Copy link";
    const trigger = document.createElement("button");
    trigger.textContent = "Share";
    element.append(trigger);
    document.body.append(element);

    const slot = element.shadowRoot?.querySelector("slot") as HTMLSlotElement;
    expect(slot.assignedElements()[0]).toBe(trigger);

    const host = element.shadowRoot?.querySelector('[part="trigger-host"]') as HTMLElement;
    host.dispatchEvent(new Event("mouseenter"));

    expect(element.open).toBe(true);
    expect(trigger.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("applies a data-theme attribute for non-default themes and positions on open", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "This field is required";
    element.theme = "error";
    document.body.append(element);

    const panel = element.shadowRoot?.querySelector('[part="tooltip"]') as HTMLElement;
    expect(panel.getAttribute("data-theme")).toBe("error");

    // Positioning runs on open: the panel is placed with fixed coordinates.
    element.show();
    expect(panel.style.position).toBe("fixed");
    expect(panel.style.top).not.toBe("");

    // Reverting to default removes the attribute.
    element.theme = "default";
    expect(panel.hasAttribute("data-theme")).toBe(false);
  });

  it("renders rich slotted content alongside the label", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Preview";
    const img = document.createElement("img");
    img.slot = "content";
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    element.append(img);
    document.body.append(element);

    const contentSlot = element.shadowRoot?.querySelector(
      'slot[name="content"]',
    ) as HTMLSlotElement;
    expect(contentSlot.assignedElements()[0]).toBe(img);
    // The plain-text trigger slot stays separate from the content slot.
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Preview");
  });

  it("exposes a placement attribute steering the resolved side", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Above";
    element.placement = "top-center";
    document.body.append(element);

    expect(element.getAttribute("placement")).toBe("top-center");
    // Opening positions without throwing for a non-default placement.
    element.show();
    expect((element.shadowRoot?.querySelector('[part="tooltip"]') as HTMLElement).style.position).toBe(
      "fixed",
    );
  });

  it("keeps the tooltip open when focus moves within a compound slotted trigger", () => {
    const element = document.createElement("box-tooltip") as BoxTooltipElement;
    element.label = "Compound trigger help";
    const wrapper = document.createElement("span");
    const first = document.createElement("button");
    first.textContent = "Icon";
    const second = document.createElement("a");
    second.href = "#";
    second.textContent = "Label";
    wrapper.append(first, second);
    element.append(wrapper);
    document.body.append(element);

    first.focus();
    expect(element.open).toBe(true);

    const host = element.shadowRoot?.querySelector('[part="trigger-host"]') as HTMLElement;
    host.dispatchEvent(
      new FocusEvent("focusout", {
        bubbles: true,
        relatedTarget: second,
      }),
    );

    expect(element.open).toBe(true);
  });
});
