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
});
