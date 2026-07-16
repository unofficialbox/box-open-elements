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

  it("preserves focus on a trigger when an attribute changes", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    element.items = [
      { label: "Details", value: "details", content: "Item details" },
      { label: "History", value: "history", content: "Activity history" },
    ];
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.focus();
    expect(element.shadowRoot?.activeElement).toBe(trigger);

    element.label = "Item sections";

    expect(element.shadowRoot?.querySelector('[part="trigger"]')).toBe(trigger);
    expect(element.shadowRoot?.activeElement).toBe(trigger);
  });

  it("includes brand focus-visible and hover styles for triggers", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    element.items = [{ label: "Details", value: "details", content: "Item details" }];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="trigger"]:focus-visible');
    expect(styles).toContain('[part="trigger"]:hover:not(:disabled)');
    expect(styles).toContain("--boe-token-surface-surface-hover");
    expect(styles).toContain("--boe-token-stroke-stroke-hover");
  });

  it("uses compact grouped item styles", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    element.items = [{ label: "Details", value: "details", content: "Item details" }];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.2rem;");
    expect(styles).toContain("padding: 0.2rem;");
    expect(styles).toContain("border-radius: 0.75rem;");
    expect(styles).toContain("padding: 0.6rem 0.65rem;");
    expect(styles).toContain("inline-size: 1.35rem;");
  });

  it("collapses the open panel when its trigger is clicked again", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    const changed = vi.fn();
    element.items = [
      { label: "Details", value: "details", content: "Item details" },
      { label: "History", value: "history", content: "Activity history" },
    ];
    element.addEventListener("value-changed", changed);
    document.body.append(element);

    const openTrigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    openTrigger.click();

    expect(element.value).toBe("");
    expect(changed).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: { value: "" },
      }),
    );

    const panels = element.shadowRoot?.querySelectorAll('[part="panel"]') ?? [];
    panels.forEach(panel => {
      expect((panel as HTMLElement).hidden).toBe(true);
    });
  });

  it("wraps triggers in heading elements and exposes a labeled region", () => {
    const element = document.createElement("box-accordion") as BoxAccordionElement;
    element.label = "Item sections";
    element.items = [{ label: "Details", value: "details", content: "Item details" }];
    document.body.append(element);

    const accordion = element.shadowRoot?.querySelector('[part="accordion"]') as HTMLElement;
    expect(accordion.getAttribute("role")).toBe("region");
    expect(accordion.getAttribute("aria-label")).toBe("Item sections");

    const heading = element.shadowRoot?.querySelector('[part="heading"]');
    expect(heading?.tagName).toBe("H3");
    expect(heading?.querySelector('[part="trigger"]')).toBeTruthy();
  });
});

