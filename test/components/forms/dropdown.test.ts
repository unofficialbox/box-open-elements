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

  it("exposes listbox/option roles and moves focus with ArrowDown", async () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    trigger.click();
    await Promise.resolve();
    await Promise.resolve();

    const menu = element.shadowRoot?.querySelector('[part="menu"]');
    expect(menu?.getAttribute("role")).toBe("listbox");
    const items = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="item"]') ?? [],
    );
    expect(items[0]?.getAttribute("role")).toBe("option");
    items[0]?.focus();
    expect(element.shadowRoot?.activeElement).toBe(items[0]);

    items[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(items[1]);

    items[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await Promise.resolve();
    expect(element.value).toBe("table");
    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    await Promise.resolve();
    await Promise.resolve();

    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLButtonElement;
    item?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(element.shadowRoot?.querySelector('[part="menu"]')).toBeNull();
    expect(element.shadowRoot?.activeElement).toBe(trigger);
  });

  it("includes focus-visible and hover styles for trigger and items", () => {
    const element = document.createElement("box-dropdown") as BoxDropdownElement;
    element.items = [
      { id: "list", label: "List" },
      { id: "table", label: "Table" },
    ];
    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement | null;
    trigger?.click();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="trigger"]:focus-visible');
    expect(styles).toContain('[part="trigger"]:hover:not(:disabled)');
    expect(styles).toContain('[part="item"]:focus-visible');
    expect(styles).toContain('[part="item"]:hover:not(:disabled)');
  });
});
