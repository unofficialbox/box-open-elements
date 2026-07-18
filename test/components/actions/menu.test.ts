// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxMenuElement, defineBoxMenuElement } from "../../../src/components/actions/menu.js";

describe("BoxMenuElement", () => {
  beforeEach(() => {
    defineBoxMenuElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders menu items", () => {
    const element = document.createElement("box-menu") as BoxMenuElement;
    element.items = [
      { id: "rename", label: "Rename" },
      { id: "archive", label: "Archive" },
    ];

    document.body.append(element);

    const items = element.shadowRoot?.querySelectorAll('[part="menu-item"]') ?? [];
    expect(items).toHaveLength(2);
  });

  it("emits selected items", () => {
    const element = document.createElement("box-menu") as BoxMenuElement;
    const selected = vi.fn();
    element.items = [
      { id: "rename", label: "Rename" },
      { id: "archive", label: "Archive" },
    ];
    element.addEventListener("item-selected", selected);

    document.body.append(element);

    const firstItem = element.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null;
    firstItem?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { id: "rename", label: "Rename" },
      }),
    );
  });

  it("forwards disabled state to items", () => {
    const element = document.createElement("box-menu") as BoxMenuElement;
    element.disabled = true;
    element.items = [{ id: "rename", label: "Rename" }];

    document.body.append(element);

    const item = element.shadowRoot?.querySelector('[part="menu-item"]') as HTMLButtonElement | null;

    expect(item?.disabled).toBe(true);
  });

  it("uses roving tabindex and ArrowDown/Home/End between menuitems", async () => {
    const element = document.createElement("box-menu") as BoxMenuElement;
    element.items = [
      { id: "rename", label: "Rename" },
      { id: "share", label: "Share" },
      { id: "archive", label: "Archive" },
    ];
    document.body.append(element);

    const items = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="menu-item"]') ?? [],
    );
    expect(items.map(item => item.tabIndex)).toEqual([0, -1, -1]);

    items[0]?.focus();
    items[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(items[1]);

    items[1]?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(items[2]);

    items[2]?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(items[0]);
  });

  it("uses BUE overlay menu geometry", () => {
    const element = document.createElement("box-menu") as BoxMenuElement;
    element.items = [{ id: "a", label: "Open" }];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 12px;");
    expect(styles).toContain("border-radius: 20px;");
    expect(styles).toContain("min-height: 30px;");
    expect(styles).toContain("padding: 8px 48px 8px 8px;");
    expect(styles).toContain("0 4px 12px");
  });
});
