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

  it("closes on document-level Escape while open", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.innerHTML = "<p>Popover content</p>";

    document.body.append(element);
    element.show();
    expect(element.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(element.open).toBe(false);
  });

  it("closes on outside pointerdown while open", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.innerHTML = "<p>Popover content</p>";

    document.body.append(element);
    element.show();
    expect(element.open).toBe(true);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(element.open).toBe(false);
  });

  it("does not bind document listeners while detached", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.innerHTML = "<p>Popover content</p>";
    element.show();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(element.open).toBe(true);

    document.body.append(element);
    expect(element.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(element.open).toBe(false);
  });

  it("restores focus to the trigger when Escape closes from inside", async () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    const content = document.createElement("button");
    content.textContent = "Inside";
    element.append(content);

    document.body.append(element);
    element.show();
    await Promise.resolve();

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    content.focus();
    expect(document.activeElement).toBe(content);

    content.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));

    expect(element.open).toBe(false);
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(trigger);
  });

  it("uses compact popover shell styles", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("border-radius: 0.7rem;");
    expect(styles).toContain("padding: 0.7rem;");
    expect(styles).toContain("border-radius: 0.7rem;");
    expect(styles).toContain("padding: 0.4rem 0.7rem;");
  });

  it("floats the surface with absolute positioning and optional placement", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.placement = "top";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("position: absolute");
    expect(styles).toContain("z-index: 30");
    expect(styles).toContain(':host([placement="top"])');
    expect(element.placement).toBe("top");
  });

  it("falls back to bottom placement for unsupported values", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.setAttribute("placement", "diagonal");
    document.body.append(element);

    expect(element.placement).toBe("bottom");
  });

  it("moves focus into the surface when opened", async () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    const content = document.createElement("button");
    content.textContent = "Inside";
    element.append(content);
    document.body.append(element);

    element.show();
    await Promise.resolve();

    expect(document.activeElement).toBe(content);
  });

  it("associates the trigger and dialog surface for assistive tech", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    const surface = element.shadowRoot?.querySelector('[part="surface"]') as HTMLElement | null;

    expect(trigger?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger?.getAttribute("aria-controls")).toBe(surface?.id);
    expect(surface?.getAttribute("aria-labelledby")).toBe(trigger?.id);
  });

  it("disables the trigger and prevents opening when disabled", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.label = "Open details";
    element.disabled = true;
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    expect(trigger?.disabled).toBe(true);

    trigger?.click();
    expect(element.open).toBe(false);

    element.show();
    expect(element.open).toBe(false);
  });

  it("closes when disabled while open", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    document.body.append(element);
    element.show();
    expect(element.open).toBe(true);

    element.disabled = true;

    expect(element.open).toBe(false);
    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    expect(trigger?.disabled).toBe(true);
  });

  it("does not open via the open attribute when disabled", () => {
    const element = document.createElement("box-popover") as BoxPopoverElement;
    element.disabled = true;
    document.body.append(element);

    element.setAttribute("open", "");

    expect(element.open).toBe(false);
    expect(element.hasAttribute("open")).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="surface"]')?.hasAttribute("hidden")).toBe(true);
  });
});
